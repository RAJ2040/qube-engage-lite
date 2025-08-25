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

async function httpPost<T>(path: string, body: unknown, init?: RequestInit): Promise<T> {
	const controller = new AbortController()
	const timeout = setTimeout(() => controller.abort(), 20000)

	try {
		const res = await fetch(`${API_BASE_URL}${path}`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Accept: "application/json",
			},
			body: JSON.stringify(body ?? {}),
			signal: controller.signal,
			...init,
		})

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

// Catalogs and Operators
export interface UserPropsCatalogPayload {
	base_schema: Record<string, "string" | "number" | "date" | "bool">,
	properties_schema: Record<string, "string" | "number" | "date" | "bool">,
	updated_at: number
}

export function fetchUserPropsCatalog() {
	return httpGet<ApiResponse<UserPropsCatalogPayload>>(`/app/events/catalog/user_props`)
}

export interface EventsCatalogItem {
	event_name: string
	updated_at: number
	properties_schema: Record<string, "string" | "number" | "date" | "bool">
	samples?: Record<string, unknown[]>
}

export interface EventsCatalogPayload {
	items: EventsCatalogItem[]
	total: number
}

export function fetchEventsCatalog() {
	return httpGet<ApiResponse<EventsCatalogPayload>>(`/app/events/catalog`)
}

export interface EventCatalogDetailsPayload {
	_id: string
	properties_schema: Record<string, "string" | "number" | "date" | "bool">
	updated_at: number
}

export function fetchEventCatalogDetails(eventName: string) {
	// The backend expects raw name, ensure it's properly encoded when used in URL
	return httpGet<ApiResponse<EventCatalogDetailsPayload>>(`/app/events/catalog/${encodeURIComponent(eventName)}`)
}

export type OperatorType = "eq" | "in" | "regex" | "exists" | "gte" | "lte" | "between"

export interface OperatorsCatalogPayload {
	string: OperatorType[]
	number: OperatorType[]
	date: OperatorType[]
	bool: OperatorType[]
}

export function fetchOperatorsCatalog() {
	return httpGet<ApiResponse<OperatorsCatalogPayload>>(`/app/events/catalog/operators`, {
		headers: { Accept: "application/json" },
	})
}

// Segment definition, preview, and create
export interface SegmentEventFilter {
	name: string
	userId?: string
	prop?: Record<string, unknown>
	eventTime?: { start?: string; end?: string }
}

export interface SegmentDefinition {
	criteria?: Record<string, unknown>
	anyOfEvents?: Array<{ event: SegmentEventFilter }>
}

export interface SegmentsPreviewRequest {
	definition: SegmentDefinition
	page?: number
	limit?: number
	sortBy?: string
	sortDir?: "asc" | "desc"
}

export interface SegmentsPreviewItem {
	_id?: unknown
	user_id?: string
	email?: string
	name?: string
	age?: number
	gender?: string
	login_date?: number
	company_name?: string
	event_time?: number
	phone_number?: string
	properties?: Record<string, unknown>
	created_at?: number
	updated_at?: number
}

export interface SegmentsPreviewPayload {
	items: SegmentsPreviewItem[]
	page: number
	limit: number
	total: number
	totalPages: number
	sortBy?: string
	sortDir?: string
}

export function previewSegment(body: SegmentsPreviewRequest) {
	return httpPost<ApiResponse<SegmentsPreviewPayload>>(`/app/segments/preview`, body)
}

export interface CreateSegmentRequest {
	name: string
	description?: string
	status?: string
	is_active?: number
	definition: SegmentDefinition
}

export interface CreateSegmentResponse {
	id?: number | string
	referenceId?: string
	name: string
	status?: string
	isActive?: number
	createdAt?: number
	updatedAt?: number
}

export function createSegment(body: CreateSegmentRequest) {
	return httpPost<ApiResponse<CreateSegmentResponse>>(`/app/segments`, body)
}

