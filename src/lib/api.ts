export interface ApiResponse<T> {
	status: boolean
	data: T
	message?: string
}

// Set VITE_API_BASE_URL to your backend domain.
export const API_BASE_URL = (
	(import.meta as any).env?.VITE_API_BASE_URL ?? ""
) as string

async function httpGet<T>(path: string, init?: RequestInit): Promise<T> {
	const controller = new AbortController()
	const timeout = setTimeout(() => controller.abort(), 15000)

	try {
		const res = await fetch(`${API_BASE_URL}${path}`, {
			method: "GET",
			headers: {
				"Content-Type": "application/json",
				Accept: "application/json",
			},
			signal: controller.signal,
			...init,
		})

		// Handle non-2xx and non-JSON responses with more context
		const contentType = res.headers.get("content-type") || ""
		if (!res.ok) {
			const text = await res.text().catch(() => "")
			throw new Error(`Request failed (${res.status}): ${text.slice(0, 200) || res.statusText}`)
		}

		if (!contentType.includes("application/json")) {
			const text = await res.text().catch(() => "")
			throw new Error(
				`Expected JSON but received '${contentType}'. Sample: ${text.slice(0, 200)}`
			)
		}

		return (await res.json()) as T
	} finally {
		clearTimeout(timeout)
	}
}

// Events API
export interface EventItem {
	id: string | null
	name: string
	description?: string
	properties?: Record<string, unknown>
	device_details?: {
		os?: string
		osVersion?: string
	}
	user_id?: string
	event_time: number
}

export interface EventsPayload {
	total: number
	limit: number
	totalPages: number
	sortBy: string
	page: number
	items: EventItem[]
	sortDir: string
}

export function fetchEvents(params?: {
	page?: number
	limit?: number
	sortBy?: string
	sortDir?: "asc" | "desc"
}) {
	const search = new URLSearchParams()
	if (params?.page) search.set("page", String(params.page))
	if (params?.limit) search.set("limit", String(params.limit))
	if (params?.sortBy) search.set("sortBy", params.sortBy)
	if (params?.sortDir) search.set("sortDir", params.sortDir)
	const qs = search.toString()
	return httpGet<ApiResponse<EventsPayload>>(`/app/events${qs ? `?${qs}` : ""}`)
}


// Segments API
export interface SegmentItem {
    id: number
    referenceId: string
    name: string
    description?: string
    filters?: string
    status?: string
    isActive?: number
    createdAt?: number
    updatedAt?: number
}

export interface SegmentsPayload {
    items: SegmentItem[]
    page: number
    limit: number
    total: number
    totalPages: number
}

export function fetchSegments(params?: {
    page?: number
    limit?: number
}) {
    const search = new URLSearchParams()
    if (params?.page) search.set("page", String(params.page))
    if (params?.limit) search.set("limit", String(params.limit))
    const qs = search.toString()
    return httpGet<ApiResponse<SegmentsPayload>>(`/app/segments${qs ? `?${qs}` : ""}`)
}

