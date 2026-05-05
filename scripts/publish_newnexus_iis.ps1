Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$projectRoot = 'C:\dev\NewNexus'
$webRoot = Join-Path $projectRoot 'NewNexus.Web'
$apiProject = Join-Path $projectRoot 'NewNexus.Api\NewNexus.Api.csproj'
$publishRoot = 'C:\inetpub\newnexus'
$spaDistRoot = Join-Path $webRoot 'dist'
$apiWwwRoot = Join-Path $projectRoot 'NewNexus.Api\wwwroot'
$appPoolName = 'NewNexusPool'
$siteName = 'Localaure'
$appPath = '/newNexus'
$appOfflineFile = Join-Path $publishRoot 'app_offline.htm'
$parentWebConfig = 'C:\inetpub\locatif\web.config'

Write-Host 'Building frontend...'
Push-Location $webRoot
try {
    & npm.cmd run build
}
finally {
    Pop-Location
}

Write-Host 'Refreshing API wwwroot from frontend dist...'
if (Test-Path $apiWwwRoot) {
    Remove-Item -LiteralPath $apiWwwRoot -Recurse -Force
}

New-Item -ItemType Directory -Path $apiWwwRoot | Out-Null
Copy-Item -Path (Join-Path $spaDistRoot '*') -Destination $apiWwwRoot -Recurse -Force

Write-Host 'Ensuring application pool exists...'
$poolInfo = & "$env:WinDir\System32\inetsrv\appcmd.exe" list apppool $appPoolName 2>$null
if (-not $poolInfo) {
    & "$env:WinDir\System32\inetsrv\appcmd.exe" add apppool /name:$appPoolName
}

& "$env:WinDir\System32\inetsrv\appcmd.exe" set apppool $appPoolName /managedRuntimeVersion:
& "$env:WinDir\System32\inetsrv\appcmd.exe" set apppool $appPoolName /processModel.identityType:ApplicationPoolIdentity

Write-Host 'Putting application offline before publish...'
if (Test-Path $publishRoot) {
    Set-Content -LiteralPath $appOfflineFile -Value '<html><body>NewNexus is updating.</body></html>' -Encoding ASCII
    Start-Sleep -Seconds 2
}

Write-Host 'Publishing ASP.NET application...'
dotnet publish $apiProject -c Release -o $publishRoot

if (Test-Path $appOfflineFile) {
    Remove-Item -LiteralPath $appOfflineFile -Force
}

Write-Host 'Ensuring IIS application exists...'
$appInfo = & "$env:WinDir\System32\inetsrv\appcmd.exe" list app "$siteName$appPath" 2>$null
if (-not $appInfo) {
    & "$env:WinDir\System32\inetsrv\appcmd.exe" add app /site.name:$siteName /path:$appPath /physicalPath:$publishRoot /applicationPool:$appPoolName
}
else {
    & "$env:WinDir\System32\inetsrv\appcmd.exe" set app "$siteName$appPath" /applicationPool:$appPoolName
    & "$env:WinDir\System32\inetsrv\appcmd.exe" set vdir "$siteName$appPath/" /physicalPath:$publishRoot
}

Write-Host 'Ensuring parent SPA rewrite excludes /newNexus...'
if (Test-Path $parentWebConfig) {
    [xml]$parentConfig = Get-Content -LiteralPath $parentWebConfig
    $rewriteRule = $parentConfig.configuration.'system.webServer'.rewrite.rules.rule |
        Where-Object { $_.name -eq 'SPA Routes' } |
        Select-Object -First 1

    if ($rewriteRule -and $rewriteRule.conditions) {
        $existingCondition = $rewriteRule.conditions.add |
            Where-Object { $_.input -eq '{REQUEST_URI}' -and $_.pattern -eq '^/newNexus(/|$)' } |
            Select-Object -First 1

        if (-not $existingCondition) {
            $condition = $parentConfig.CreateElement('add')
            $condition.SetAttribute('input', '{REQUEST_URI}')
            $condition.SetAttribute('pattern', '^/newNexus(/|$)')
            $condition.SetAttribute('negate', 'true')
            [void]$rewriteRule.conditions.AppendChild($condition)
            $parentConfig.Save($parentWebConfig)
        }
    }
}

Write-Host 'Restarting application pool...'
& "$env:WinDir\System32\inetsrv\appcmd.exe" start apppool /apppool.name:$appPoolName | Out-Null

Write-Host "NewNexus published to IIS at $appPath"
