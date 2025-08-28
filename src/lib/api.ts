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

async function httpPost<T, B = unknown>(path: string, body: B, init?: RequestInit): Promise<T> {
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

async function httpPatch<T, B = unknown>(path: string, body: B, init?: RequestInit): Promise<T> {
	const controller = new AbortController()
	const timeout = setTimeout(() => controller.abort(), 20000)

	try {
		const res = await fetch(`${API_BASE_URL}${path}`, {
			method: "PATCH",
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

export function searchSegments(query: string, params?: { page?: number; limit?: number }) {
    const search = new URLSearchParams()
    if (query) search.set("q", query)
    if (params?.page) search.set("page", String(params.page))
    if (params?.limit) search.set("limit", String(params.limit))
    const qs = search.toString()
    return httpGet<ApiResponse<SegmentsPayload>>(`/app/segments${qs ? `?${qs}` : ""}`)
}

// Campaigns API
export interface ScheduleData {
    start_date: string
    start_time: string
    end_time?: string
    recurrence: string
    selected_week_days?: string[]
    custom_interval?: number
    custom_unit?: string
    timezone: string
}

export interface CreateCampaignRequest {
    name: string
    description: string
    segment_id?: string
    channel_name?: string
    message_template_id?: string
    schedule_type?: string
    schedule_json?: string
}

export interface CreateCampaignResponseData {
    id: number
    reference_id: string
    name: string
    description: string
    target_type: string
    segment_id?: string
    channel_name?: string
    message_template_id?: string
    status: string
}

export function createCampaign(payload: CreateCampaignRequest) {
    return httpPost<ApiResponse<{ id: number; reference_id: string } | CreateCampaignResponseData>, CreateCampaignRequest>(
        `/app/campaigns`,
        payload,
        { headers: { "Content-Type": "application/json" } }
    )
}

export function updateCampaign(referenceId: string, payload: CreateCampaignRequest) {
    return httpPatch<ApiResponse<CreateCampaignResponseData>, CreateCampaignRequest>(
        `/app/campaigns/${referenceId}`,
        payload,
        { headers: { "Content-Type": "application/json" } }
    )
}

export interface CampaignDetailsData {
    id: number
    referenceId: string
    name: string
    description: string
    targetType: string
    segmentId?: string
    audienceJson?: string | null
    channelName?: string
    messageTemplateId?: string
    channelJson?: string | null
    scheduleType?: string
    scheduleJson?: string | null
    policyJson?: string | null
    status: string
    statusReason?: string | null
    isActive: number
    createdBy?: string
    updatedBy?: string
    createdAt: number
    updatedAt: number
    deletedAt?: number | null
}

export function fetchCampaignByRef(referenceId: string) {
    return httpGet<ApiResponse<CampaignDetailsData>>(`/app/campaigns/${referenceId}`, {
        headers: { "Content-Type": "application/json" },
    })
}

export interface LaunchCampaignResponseData {
    campaign_id: number
    reference_id: string
    status: string
    schedule_type?: string
    schedule_json?: string
    execution?: {
        id: number
        reference_id: string
        run_no: number
        status: string
        audience_count: number
    }
}

export function launchCampaign(referenceId: string) {
    return httpPost<ApiResponse<LaunchCampaignResponseData>, Record<string, never>>(
        `/app/campaigns/${referenceId}/launch`,
        {},
        { headers: { "Content-Type": "application/json" } }
    )
}

// Template by name API
export interface TemplateDetailItem {
    reference_id: string
    partner_template_name: string
    partner_template_id: string
    template_name: string
    channel_name: string
    provider_name: string
    template_type: string
    template_body: string
    status: string
    created_at: string
    updated_at: string
}

export function fetchTemplateByName(name: string) {
    const search = new URLSearchParams()
    search.set("name", name)
    const qs = search.toString()
    return httpGet<ApiResponse<TemplateDetailItem[]>>(`/api/engagements/messages/templates?${qs}`, {
        headers: {
            Accept: "application/json",
            "X-API-KEY": "f6d646a6c2f2df883ea0cccaa4097358ede98284",
            Authorization: "Bearer ee26cc77-d4f4-4cfc-b8cc-8b95795dd57e",
        },
    })
}

// Templates API
export interface TemplateIdItem {
    reference_id: string
    template_name: string
    channel_name: string
    provider_name: string
}

export function fetchTemplateIds() {
    return httpGet<ApiResponse<TemplateIdItem[]>>(`/api/engagements/messages/templates/ids`, {
        headers: { Accept: "application/json" },
    })
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

// Campaigns listing API
export interface CampaignListItem {
    id: number
    referenceId: string
    name: string
    description: string
    targetType: string
    segmentId?: string
    audienceJson?: string | null
    channelName?: string
    messageTemplateId?: string
    channelJson?: string | null
    scheduleType?: string
    scheduleJson?: string | null
    policyJson?: string | null
    status: string
    statusReason?: string | null
    isActive: number
    createdBy?: string
    updatedBy?: string
    createdAt: number
    updatedAt: number
    deletedAt?: number | null
}

export interface CampaignsPayload {
    items: CampaignListItem[]
    page: number
    limit: number
    total: number
    totalPages: number
}

export function fetchCampaigns(params: { page?: number; limit?: number }) {
    const search = new URLSearchParams()
    if (params.page) search.set("page", params.page.toString())
    if (params.limit) search.set("limit", params.limit.toString())
    const qs = search.toString()
    return httpGet<ApiResponse<CampaignsPayload>>(`/app/campaigns${qs ? `?${qs}` : ""}`, {
        headers: { "Content-Type": "application/json" },
    })
}

