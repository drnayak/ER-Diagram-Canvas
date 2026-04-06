export type Column = {
  name: string;
  type: string;
  pk?: boolean;
  fk?: string;
};

export type Index = {
  name: string;
  columns: string[];
};

export type Table = {
  table_name: string;
  description?: string;
  primary_key?: string;
  module?: string;
  columns: Column[];
  indexes?: Index[];
};

export type Relationship = {
  from: string;
  to: string;
  type: string;
};

export type Schema = {
  database?: string;
  version?: string;
  tables: Table[];
  relationships: Relationship[];
  erd_metadata?: {
    layout?: string;
    modules?: string[];
  };
};
