export interface AuthTokensHasher {
  hash(token: string): Promise<string>;
  compare(token: string, hash: string): Promise<boolean>;
}
