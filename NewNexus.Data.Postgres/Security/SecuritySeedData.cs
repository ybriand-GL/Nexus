using NewNexus.Domain.Security;

namespace NewNexus.Data.Postgres.Security;

internal static class SecuritySeedData
{
    internal static readonly Guid ModuleAdministrationId = Guid.Parse("3cbcc9c0-20e1-4a71-a6d9-84cbcb4d18d9");
    internal static readonly Guid ModuleContraventionsId = Guid.Parse("e97cef7f-67c9-4604-8987-4061536742db");
    internal static readonly Guid ModuleMapId = Guid.Parse("f0ecf806-db04-4ca0-a28a-a4c6064d5ea4");
    internal static readonly Guid ModuleDriverIndicatorsId = Guid.Parse("2b098a1c-f365-4061-af8a-d6607a1324dd");
    internal static readonly Guid ModuleTractorIndicatorsId = Guid.Parse("98f300bb-99f5-4980-a4f8-ee75f9588ca2");
    internal static readonly Guid ModuleCommonDataId = Guid.Parse("6d56c6e5-0e73-4772-9b0c-6a8d0f68a5d4");
    internal static readonly Guid ModuleDashboardInformatiqueId = Guid.Parse("bcf37d38-6e8a-4b9e-82f9-66ec0e2d0451");
    internal static readonly Guid ModuleDashboardDirectionId = Guid.Parse("a1701377-bdd4-4f0f-9159-76c12d4f9fb6");
    internal static readonly Guid ModuleDashboardExploitationId = Guid.Parse("2d0832df-7431-46f7-9935-2c8d27c1d8a4");
    internal static readonly Guid ModuleDashboardAdministratifId = Guid.Parse("c3a46e30-7392-4107-b56f-a1bb4f775522");

    internal static readonly Guid ProfileInformatiqueId = Guid.Parse("87b15c32-a3be-4e6c-90ff-3d228e561740");
    internal static readonly Guid ProfileDirectionId = Guid.Parse("b605e430-08c7-4f27-ad1d-a6fc70336da5");
    internal static readonly Guid ProfileExploitationId = Guid.Parse("8fbc1d63-4c92-4efe-9b03-a2e96f2f7b16");
    internal static readonly Guid ProfileAdministratifId = Guid.Parse("0094b3de-3992-49d0-b5ea-b2b97a7c5d71");
    internal static readonly Guid BootstrapAdminAccountId = Guid.Parse("5f6f6d4b-a2af-4d74-9ab3-6b033463d6a1");
    internal const string BootstrapAdminPasswordHash = "100000.T4PL0v0v1mGm2O8x2M8vMw==.xdyoWj/llsa9F5KoRoeZc8mUL29qNlCKh8LzHxzd8MM=";

    internal static IEnumerable<SecurityModule> BuildModules()
    {
        yield return new SecurityModule
        {
            Id = ModuleAdministrationId,
            Code = "ADMINISTRATION",
            Label = "Administration",
            NavigationGroup = "Administration",
            DisplayOrder = 1,
            IsActive = true
        };

        yield return new SecurityModule
        {
            Id = ModuleMapId,
            Code = "CARTE_POINTS_CHARGEMENT_DECHARGEMENT",
            Label = "Carte des points chargements/d\u00e9chargements",
            NavigationGroup = "Exploitation",
            DisplayOrder = 1,
            IsActive = true
        };

        yield return new SecurityModule
        {
            Id = ModuleDriverIndicatorsId,
            Code = "INDICATEURS_CONDUCTEURS",
            Label = "Les indicateurs conducteurs",
            NavigationGroup = "Exploitation",
            DisplayOrder = 2,
            IsActive = true
        };

        yield return new SecurityModule
        {
            Id = ModuleTractorIndicatorsId,
            Code = "INDICATEURS_TRACTEURS",
            Label = "Les indicateurs des tracteurs",
            NavigationGroup = "Exploitation",
            DisplayOrder = 3,
            IsActive = true
        };

        yield return new SecurityModule
        {
            Id = ModuleContraventionsId,
            Code = "CONTRAVENTIONS",
            Label = "Gestion des contraventions",
            NavigationGroup = "Gestion administrative",
            DisplayOrder = 1,
            IsActive = true
        };

        yield return new SecurityModule
        {
            Id = ModuleCommonDataId,
            Code = "DONNEES_COMMUNES",
            Label = "Donn\u00e9es Communes",
            NavigationGroup = "Donn\u00e9es Communes",
            DisplayOrder = 1,
            IsActive = true
        };

        yield return new SecurityModule
        {
            Id = ModuleDashboardInformatiqueId,
            Code = "DASHBOARD_INFORMATIQUE",
            Label = "Dashboard Informatique",
            NavigationGroup = "Tableaux de bord",
            DisplayOrder = 1,
            IsActive = true
        };

        yield return new SecurityModule
        {
            Id = ModuleDashboardDirectionId,
            Code = "DASHBOARD_DIRECTION",
            Label = "Dashboard Direction",
            NavigationGroup = "Tableaux de bord",
            DisplayOrder = 2,
            IsActive = true
        };

        yield return new SecurityModule
        {
            Id = ModuleDashboardExploitationId,
            Code = "DASHBOARD_EXPLOITATION",
            Label = "Dashboard Exploitation",
            NavigationGroup = "Tableaux de bord",
            DisplayOrder = 3,
            IsActive = true
        };

        yield return new SecurityModule
        {
            Id = ModuleDashboardAdministratifId,
            Code = "DASHBOARD_ADMINISTRATIF",
            Label = "Dashboard Administratif",
            NavigationGroup = "Tableaux de bord",
            DisplayOrder = 4,
            IsActive = true
        };
    }

    internal static IEnumerable<SecurityProfile> BuildProfiles()
    {
        yield return new SecurityProfile
        {
            Id = ProfileInformatiqueId,
            Code = "INFORMATIQUE",
            Label = "Informatique",
            IsSystemProfile = true,
            IsActive = true
        };

        yield return new SecurityProfile
        {
            Id = ProfileDirectionId,
            Code = "DIRECTION",
            Label = "Direction",
            IsSystemProfile = true,
            IsActive = true
        };

        yield return new SecurityProfile
        {
            Id = ProfileExploitationId,
            Code = "EXPLOITATION",
            Label = "Exploitation",
            IsSystemProfile = true,
            IsActive = true
        };

        yield return new SecurityProfile
        {
            Id = ProfileAdministratifId,
            Code = "ADMINISTRATIF",
            Label = "Administratif",
            IsSystemProfile = true,
            IsActive = true
        };
    }

    internal static IEnumerable<SecurityProfileModuleRight> BuildProfileRights()
    {
        foreach (var moduleId in new[]
                 {
                     ModuleAdministrationId,
                     ModuleContraventionsId,
                     ModuleMapId,
                     ModuleDriverIndicatorsId,
                     ModuleTractorIndicatorsId,
                     ModuleCommonDataId,
                     ModuleDashboardInformatiqueId,
                     ModuleDashboardDirectionId,
                     ModuleDashboardExploitationId,
                     ModuleDashboardAdministratifId
                 })
        {
            yield return CreateRight(ProfileInformatiqueId, moduleId, ModuleAccessLevel.Write);
        }

        yield return CreateRight(ProfileDirectionId, ModuleAdministrationId, ModuleAccessLevel.None);
        yield return CreateRight(ProfileDirectionId, ModuleCommonDataId, ModuleAccessLevel.Read);
        yield return CreateRight(ProfileDirectionId, ModuleContraventionsId, ModuleAccessLevel.Read);
        yield return CreateRight(ProfileDirectionId, ModuleMapId, ModuleAccessLevel.Read);
        yield return CreateRight(ProfileDirectionId, ModuleDriverIndicatorsId, ModuleAccessLevel.Read);
        yield return CreateRight(ProfileDirectionId, ModuleTractorIndicatorsId, ModuleAccessLevel.Read);
        yield return CreateRight(ProfileDirectionId, ModuleDashboardInformatiqueId, ModuleAccessLevel.None);
        yield return CreateRight(ProfileDirectionId, ModuleDashboardDirectionId, ModuleAccessLevel.Read);
        yield return CreateRight(ProfileDirectionId, ModuleDashboardExploitationId, ModuleAccessLevel.None);
        yield return CreateRight(ProfileDirectionId, ModuleDashboardAdministratifId, ModuleAccessLevel.None);

        yield return CreateRight(ProfileExploitationId, ModuleCommonDataId, ModuleAccessLevel.Read);
        yield return CreateRight(ProfileExploitationId, ModuleMapId, ModuleAccessLevel.Read);
        yield return CreateRight(ProfileExploitationId, ModuleDriverIndicatorsId, ModuleAccessLevel.Read);
        yield return CreateRight(ProfileExploitationId, ModuleTractorIndicatorsId, ModuleAccessLevel.Read);
        yield return CreateRight(ProfileExploitationId, ModuleDashboardInformatiqueId, ModuleAccessLevel.None);
        yield return CreateRight(ProfileExploitationId, ModuleDashboardDirectionId, ModuleAccessLevel.None);
        yield return CreateRight(ProfileExploitationId, ModuleDashboardExploitationId, ModuleAccessLevel.Read);
        yield return CreateRight(ProfileExploitationId, ModuleDashboardAdministratifId, ModuleAccessLevel.None);

        yield return CreateRight(ProfileAdministratifId, ModuleCommonDataId, ModuleAccessLevel.None);
        yield return CreateRight(ProfileAdministratifId, ModuleContraventionsId, ModuleAccessLevel.Write);
        yield return CreateRight(ProfileAdministratifId, ModuleDashboardInformatiqueId, ModuleAccessLevel.None);
        yield return CreateRight(ProfileAdministratifId, ModuleDashboardDirectionId, ModuleAccessLevel.None);
        yield return CreateRight(ProfileAdministratifId, ModuleDashboardExploitationId, ModuleAccessLevel.None);
        yield return CreateRight(ProfileAdministratifId, ModuleDashboardAdministratifId, ModuleAccessLevel.Read);
    }

    internal static IEnumerable<UserAccount> BuildUserAccounts()
    {
        yield return new UserAccount
        {
            Id = BootstrapAdminAccountId,
            Login = "admin",
            DisplayName = "Administrateur syst\u00e8me",
            Email = null,
            EmployeeNumber = null,
            PasswordHash = BootstrapAdminPasswordHash,
            MustChangePassword = true,
            SessionTimeoutMinutes = 60,
            IsSidebarCollapsed = false,
            SecurityProfileId = ProfileInformatiqueId,
            IsActive = true,
            CreatedAtUtc = new DateTime(2026, 4, 29, 0, 0, 0, DateTimeKind.Utc),
            LastLoginAtUtc = null,
            LastSyncedAtUtc = null
        };
    }

    private static SecurityProfileModuleRight CreateRight(Guid profileId, Guid moduleId, ModuleAccessLevel accessLevel)
    {
        var profileBytes = profileId.ToByteArray();
        var moduleBytes = moduleId.ToByteArray();
        var bytes = new byte[16];

        for (var index = 0; index < bytes.Length; index++)
        {
            bytes[index] = (byte)(profileBytes[index] ^ moduleBytes[index]);
        }

        return new SecurityProfileModuleRight
        {
            Id = new Guid(bytes),
            SecurityProfileId = profileId,
            SecurityModuleId = moduleId,
            AccessLevel = accessLevel
        };
    }
}
