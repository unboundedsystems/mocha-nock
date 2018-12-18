export interface Config {
  excludeScope: string | string[];
  overwrite: boolean;
  recordOnFailure: boolean;
  recorder: RecorderConfig;
}

export interface RecorderConfig {
  output_objects: boolean;
  dont_print: boolean;
}
