// node-zookeeper-client 声明模块

declare module 'node-zookeeper-client' {
  import { EventEmitter } from 'events'

  class ClientError extends Error {
    getCode (): number;

    getPath (): string;

    getName (): string;

    toString (): string;
  }

  interface Stat {
  }

  export type createCallBack = (error: ClientError | Exception, path: string) => void;
  export type watcherCallback = (event: Event) => void;
  export type statCallback = (error: ClientError, stat: Stat) => void;
  export type childrenCallback = (error: ClientError, children: string[], stat: Stat) => void;
  export type aclsCallback = (error: ClientError, acls: ACL[], stat: Stat) => void;
  export type dirCallback = (error: ClientError, path: string) => void;

  export class Client extends EventEmitter {
    connect (): void;

    close (): void;

    create (path: string, data: Buffer, acls: ACL[], mode: CreateMode, callback: createCallBack): void;
    create (path: string, mode: CreateMode, callback: createCallBack): void;

    remove (path: string, version: string, callback: (error: ClientError) => void): void;

    exists (path: string, watcher: watcherCallback, callback: statCallback): void;
    exists (path: string, callback: statCallback): void;

    getChildren (path: string, watcher: watcherCallback, callback: childrenCallback): void;
    getChildren (path: string, callback: childrenCallback): void;

    getData (path: string, watcher: watcherCallback, callback: childrenCallback): void;

    setData (path: string, data: Buffer, version: number, callback: statCallback): void;

    getACL (path: string, callback: aclsCallback): void;

    setACL (path: string, acls: ACL[], version: number, callback: statCallback): void;

    getState (): State;

    getSessionId (): Buffer;

    getSessionPassword (): Buffer;

    getSessionTimeout (): number;

  }

  export class Transaction {
    create (path: string, data: Buffer, acls: ACL[], mode: CreateMode): Transaction;

    setData (path: string, data: Buffer, version: number): Transaction;

    check (path: string, version: number): Transaction;

    remove (path: string, version: number): Transaction;

    commit (callback: (error: ClientError, results: string[]) => void): void;
  }

  export class Exception {
    static OK: number
    static SYSTEM_ERROR: number
    static RUNTIME_INCONSISTENCY: number
    static DATA_INCONSISTENCY: number
    static CONNECTION_LOSS: number
    static MARSHALLING_ERROR: number
    static UNIMPLEMENTED: number
    static OPERATION_TIMEOUT: number
    static BAD_ARGUMENTS: number
    static API_ERROR: number
    static NO_NODE: number
    static NO_AUTH: number
    static BAD_VERSION: number
    static NO_CHILDREN_FOR_EPHEMERALS: number
    static NODE_EXISTS: number
    static NOT_EMPTY: number
    static SESSION_EXPIRED: number
    static INVALID_CALLBACK: number
    static INVALID_ACL: number
    static AUTH_FAILED: number

    code: number
    name: string
    path: string

    getCode (): number;

    getName (): string;

    getPath (): string;

    toString (): string;
  }

  export class Id {
    static ANYONE_ID_UNSAFE: Id
    static AUTH_IDS: Id

    scheme: string
    id: string

    toRecord (): any;
  }

  export class ACL {
    static OPEN_ACL_UNSAFE: ACL
    static CREATOR_ALL_ACL: ACL
    static READ_ACL_UNSAFE: ACL

    permission: number
    id: Id

    toRecord (): any;
  }

  export class CreateMode {
    static PERSISTENT: number
    static PERSISTENT_SEQUENTIAL: number
    static EPHEMERAL: number
    static EPHEMERAL_SEQUENTIAL: number
  }

  export class State {
    name: string
    code: number

    getName (): string;

    getCode (): number;

    toString (): string;

    static SYNC_CONNECTED: State
    static CONNECTED_READ_ONLY: State
    static DISCONNECTED: State
    static AUTH_FAILED: State
    static SASL_AUTHENTICATED: State
    static EXPIRED: State
  }

  export class Event {
    type: number
    name: string
    path?: string

    getType (): number;

    getName (): string;

    getPath (): string;

    toString (): string;

    static NODE_CREATED: Event
    static NODE_DELETED: Event
    static NODE_DATA_CHANGED: Event
    static NODE_CHILDREN_CHANGED: Event
  }

  export interface connectOption {
    sessionTimeout?: number,
    spinDelay?: number,
    retries?: number
  }

  export function createClient (address: string, option: connectOption): Client;

  export function transaction (): Transaction;

  export function mkdirp (path: string, data: Buffer, acls: ACL[], mode: CreateMode, callback: dirCallback): void;

  export function addAuthInfo (scheme: string, auth: Buffer): void;
}
