import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

let authToken: string | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
}

function getHeaders(includeContentType: boolean = false): HeadersInit {
  const headers: HeadersInit = {};

  if (includeContentType) {
    headers["Content-Type"] = "application/json";
  }
  if (authToken) {
    headers["Authorization"] = `Bearer ${authToken}`;
  }

  return headers;
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(url, {
    method,
    credentials: "omit",
    headers: getHeaders(!!data),
    body: data ? JSON.stringify(data) : undefined,
  });

  await throwIfResNotOk(res);
  return res;
}

export async function uploadFile(url: string, file: File): Promise<string> {
  const uploadPath = /^\/api\/(?:cloudinary-upload|local-upload)\/[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uploadPath.test(url)) {
    throw new Error("Unexpected photo upload URL");
  }

  const res = await fetch(url, {
    method: "PUT",
    credentials: "omit",
    redirect: "error",
    headers: {
      ...getHeaders(false),
      "Content-Type": file.type,
    },
    body: file,
  });

  await throwIfResNotOk(res);
  const result = await res.json();
  if (typeof result?.url !== "string" || !result.url.trim()) {
    throw new Error("Upload did not return a photo URL");
  }
  return result.url;
}

export async function scanPhotosWithGemini(front: File, back?: File | null): Promise<Response> {
  const photos = new FormData();
  photos.append("front", front);
  if (back) photos.append("back", back);
  const res = await fetch("/api/scan-coffee-photos", {
    method: "POST",
    credentials: "omit",
    headers: getHeaders(false),
    body: photos,
  });
  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const [baseUrl, ...rest] = queryKey as unknown[];
    if (typeof baseUrl !== "string") {
      throw new Error("Invalid query key: first element must be a string URL");
    }

    // Build URL from string/number segments only; ignore objects used for cache keys
    const pathSegments = rest.filter(
      (segment): segment is string | number =>
        typeof segment === "string" || typeof segment === "number",
    );
    const requestUrl = pathSegments.length
      ? `${baseUrl}/${pathSegments.map(String).join("/")}`
      : baseUrl;

    const res = await fetch(requestUrl, {
      credentials: "omit",
      headers: getHeaders(false),
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});

export const invalidateCoffeeEntries = () =>
  queryClient.invalidateQueries({
    predicate: (query) =>
      Array.isArray(query.queryKey) && query.queryKey[0] === "/api/coffee-entries",
  });
