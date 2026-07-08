export type KnowledgeEntry = {
	id: string
	domiaId: string
	title: string
	content: string
	keywords: string[] | null
	priority: number
	isActive: boolean
	createdAt: string
	updatedAt: string
}

export type KnowledgeInput = {
	id?: string
	title: string
	content: string
	keywords?: string[] | null
	priority?: number
	isActive?: boolean
}
