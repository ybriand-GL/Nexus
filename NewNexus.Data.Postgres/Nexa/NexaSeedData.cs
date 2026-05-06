using NewNexus.Domain.Nexa;

namespace NewNexus.Data.Postgres.Nexa;

internal static class NexaSeedData
{
    internal static readonly Guid ModuleContraventionsId = Guid.Parse("439c86cf-7957-4df8-a7c7-12842a7fce11");
    internal static readonly Guid ModuleConducteursId = Guid.Parse("5af7436f-3938-4462-a12b-5fd6c42a5d4a");
    internal static readonly Guid ModuleTracteursId = Guid.Parse("67c19789-7608-46bb-81ea-76da2b195802");
    internal static readonly Guid ModulePointsId = Guid.Parse("7402f99d-57e4-4ae1-a0ef-303e89cd51ab");
    internal static readonly Guid ModuleAdministrationId = Guid.Parse("a6fe298a-f9fb-4307-8fcb-a7c59fd7553b");
    internal static readonly Guid ModuleDocumentationId = Guid.Parse("40188f75-c370-4694-b118-f0039701d878");
    internal static readonly Guid ModuleAutreId = Guid.Parse("e63c60cb-fc61-45e0-a4ee-9571d9d59252");

    internal static readonly Guid CategoryMetierId = Guid.Parse("ecf86fa9-5f1d-4102-bd4e-33a245dc195c");
    internal static readonly Guid CategoryLogicielId = Guid.Parse("05f5bdf6-3081-48eb-a2fe-7fa7d17f1a92");
    internal static readonly Guid CategoryDocumentaireId = Guid.Parse("70ad54cb-0221-4858-8b90-f7b8fcd2f728");
    internal static readonly Guid CategoryIncidentId = Guid.Parse("a1149792-48a2-4529-8bb6-64c82d8bd7fa");

    internal static IEnumerable<NexaModule> BuildModules()
    {
        yield return CreateModule(ModuleContraventionsId, "CONTRAVENTIONS", "Contraventions", 1);
        yield return CreateModule(ModuleConducteursId, "CONDUCTEURS", "Conducteurs", 2);
        yield return CreateModule(ModuleTracteursId, "TRACTEURS", "Tracteurs", 3);
        yield return CreateModule(ModulePointsId, "POINTS_CHARGEMENT_DECHARGEMENT", "Points de chargement / dechargement", 4);
        yield return CreateModule(ModuleAdministrationId, "ADMINISTRATION", "Administration", 5);
        yield return CreateModule(ModuleDocumentationId, "DOCUMENTATION", "Documentation", 6);
        yield return CreateModule(ModuleAutreId, "AUTRE", "Autre", 99);
    }

    internal static IEnumerable<NexaCategory> BuildCategories()
    {
        yield return CreateCategory(CategoryMetierId, "METIER", "Metier", 1);
        yield return CreateCategory(CategoryLogicielId, "LOGICIEL", "Logiciel", 2);
        yield return CreateCategory(CategoryDocumentaireId, "DOCUMENTAIRE", "Documentaire", 3);
        yield return CreateCategory(CategoryIncidentId, "INCIDENT", "Incident", 4);
    }

    private static NexaModule CreateModule(Guid id, string code, string label, int displayOrder)
    {
        return new NexaModule
        {
            Id = id,
            Code = code,
            Label = label,
            DisplayOrder = displayOrder,
            IsActive = true,
            IsIndexable = true
        };
    }

    private static NexaCategory CreateCategory(Guid id, string code, string label, int displayOrder)
    {
        return new NexaCategory
        {
            Id = id,
            Code = code,
            Label = label,
            DisplayOrder = displayOrder,
            IsActive = true
        };
    }
}
