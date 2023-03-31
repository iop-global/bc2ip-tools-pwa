export enum SchemaVersion {
  V1 = 1,
  V2 = 2,
}

export const SCHEMA_PROCESS_IDS = new Map<SchemaVersion, string>([
  [SchemaVersion.V1, 'cju6AFT7fhbQoOlBEi4aWy5tX6-b3jfCuTvZlWRDuphhLA'],
  [SchemaVersion.V2, 'cju7mZPnME6aWjnoXORfZLnlycQo2Wek05OTh-6sw6pVEo'],
]);

export const findSchemaByProcessId = (queriedProcessId: string): SchemaVersion | null => {
  for (const schemaVersion of SCHEMA_PROCESS_IDS.keys()) {
    const processId = SCHEMA_PROCESS_IDS.get(schemaVersion);
    if (processId === queriedProcessId) {
      return schemaVersion;
    }
  }

  return null;
};
