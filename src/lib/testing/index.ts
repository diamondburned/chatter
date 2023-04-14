import * as api from "#lib/api/";

// ExpectError is passed into the expect field to indicate that any error should
// be expected.
export const ExpectError = Symbol("ExpectError");

// APITester is a test client for the API.
export class APITester {
  url: URL;
  headers = new Headers();

  constructor(urlstr: string) {
    if (!urlstr.match(/^https?:\/\//)) {
      urlstr = "http://" + urlstr;
    }

    this.url = new URL(urlstr);

    // This doesn't work for some reason. What the heck, JavaScript?
    // if (this.url.protocol == "") {
    //   this.url.protocol = "http";
    // }
  }

  get<T extends api.ErrorResponse | any>(
    path: string,
    params: Record<string, string>,
    expect?: Exclude<T, typeof ExpectError>
  ): Promise<Extract<T, { error: never }>>;

  get<T extends api.ErrorResponse>(
    path: string,
    params: Record<string, string>,
    expect: typeof ExpectError
  ): Promise<api.ErrorResponse>;

  async get(
    path: string,
    params: Record<string, string> = {},
    expect?: any
  ): Promise<any> {
    return this.do("GET", path, params, {}, expect, expect === ExpectError);
  }

  post<ReqT, RespT extends api.FailableResponse<any>>(
    path: string,
    body: ReqT,
    expect?: Exclude<RespT, typeof ExpectError>
  ): Promise<Extract<RespT, { error: never }>>;

  post<ReqT, RespT extends api.ErrorResponse>(
    path: string,
    body: ReqT,
    expect: typeof ExpectError
  ): Promise<api.ErrorResponse>;

  async post(path: string, body: any, expect: any): Promise<any> {
    return this.do("POST", path, {}, body, expect, expect === ExpectError);
  }

  patch<ReqT, RespT extends api.ErrorResponse | any>(
    path: string,
    body: ReqT,
    expect?: Exclude<RespT, typeof ExpectError>
  ): Promise<Exclude<RespT, api.ErrorResponse>>;

  patch<ReqT, RespT extends api.ErrorResponse>(
    path: string,
    body: ReqT,
    expect: typeof ExpectError
  ): Promise<api.ErrorResponse>;

  async patch(path: string, body: any, expect: any): Promise<any> {
    return this.do("PATCH", path, {}, body, expect, expect === ExpectError);
  }

  delete<ReqT, RespT extends api.ErrorResponse | any>(
    path: string,
    body: ReqT,
    expect?: Exclude<RespT, typeof ExpectError>
  ): Promise<Exclude<RespT, api.ErrorResponse>>;

  delete<ReqT, RespT extends api.ErrorResponse>(
    path: string,
    body: ReqT,
    expect: typeof ExpectError
  ): Promise<api.ErrorResponse>;

  async delete(path: string, body: any, expect: any): Promise<any> {
    return this.do("DELETE", path, {}, body, expect, expect === ExpectError);
  }

  private async do<T>(
    method: string,
    path: string,
    params: Record<string, string>,
    requestBody: any | undefined,
    expect: T | undefined,
    expectError: boolean
  ): Promise<T | api.ErrorResponse> {
    const url = new URL(this.url);
    url.pathname = path;

    if (params) {
      const searchParams = new URLSearchParams(params);
      url.search = searchParams.toString();
    }

    const resp = await fetch(url.toString(), {
      body: method != "GET" ? JSON.stringify(requestBody) : undefined,
      method: method,
      headers: this.headers,
    });

    if (resp.status == 204) {
      return;
    }

    const body = await resp.json();
    if (expectError) {
      if (!body.error) {
        throw new Error(`expected server error, got: ${body}`);
      }
    } else if (body.error) {
      throw new Error(`unexpected server error: ${body.error}`);
    }

    if (!expectError && (resp.status < 200 || resp.status >= 300)) {
      throw new Error(`unexpected status code: ${resp.status}`);
    }

    if (expect) {
      assertEq(body, expect);
    }

    return body as T;
  }
}

export function assertResponse<T>(r: api.ErrorResponse | T): T {
  if ((r as api.ErrorResponse).error) {
    throw new Error(
      `unexpected error response: ${(r as api.ErrorResponse).error}`
    );
  }
  return r as T;
}

function msg(wrap: string, message: string): string {
  return wrap ? `${wrap}: ${message}` : message;
}

export function assert(condition: any, message = "") {
  if (!condition) {
    throw new Error(msg("Assertion failed", message));
  }
}

export function assertEq<T1, T2 extends T1>(a: T1, b: T2, message = "$") {
  if (a === b) {
    return;
  }

  assert(
    typeof a === typeof b,
    msg(`types differ: ${typeof a} !=== ${typeof b}`, message)
  );

  if (typeof a === "object") {
    if (Array.isArray(a) && Array.isArray(b)) {
      assert(a.length === b.length, msg(`length mismatch`, message));
      for (let i = 0; i < a.length; i++) {
        assertEq(a[i], b[i], message + "[]");
      }
    } else {
      const oa = a as Record<string, any>;
      const ob = b as Record<string, any>;
      const keys = new Set([...Object.keys(oa), ...Object.keys(ob)]);
      for (const key of keys) {
        assertEq(oa[key], ob[key], message + "." + key);
      }
    }
  } else {
    assert(a === b, msg(`expected ${a} to equal ${b}`, message));
  }
}
