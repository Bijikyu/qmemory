declare module 'pg' {
  const Pool: any;
  export { Pool };
}

declare module 'mysql2/promise' {
  export function createConnection(config: any): Promise<any>;
}

declare module 'mysql2/promise' {
  import * as mysql from 'mysql2';
  export = mysql;
}
