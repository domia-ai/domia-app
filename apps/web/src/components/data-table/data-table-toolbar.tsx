import { ChevronDown, Download, Search, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select"
import { ColumnVisibility } from "./column-visibility"
import { cn } from "@/lib/utils"
import type {
	DataTableToolbarProps,
	FilterFacet,
	FilterFacetOption,
} from "@/types/table"

const toggleInList = (current: string, value: string) => {
	const set = new Set(current ? current.split(",").filter(Boolean) : [])
	if (set.has(value)) set.delete(value)
	else set.add(value)
	return [...set].join(",")
}

export function DataTableToolbar({
	searchInput,
	setSearchInput,
	searchPlaceholder = "Search…",
	facets = [],
	facetOptions = {},
	filters,
	setFilter,
	applyParams,
	presets = [],
	filterKeys = [],
	columnToggles,
	columnVisibility,
	setColumnVisibility,
	exportHref,
}: DataTableToolbarProps) {
	const hasFilters = Boolean(searchInput) || filterKeys.some((k) => filters[k])

	const clearAll = () => {
		setSearchInput("")
		const reset: Record<string, string | null> = {
			q: null,
			sort: null,
			dir: null,
		}
		for (const key of filterKeys) reset[key] = null
		applyParams(reset)
	}

	const optionsFor = (facet: FilterFacet): FilterFacetOption[] =>
		facetOptions[facet.key] ?? facet.options ?? []

	const renderFacet = (facet: FilterFacet) => {
		const current = filters[facet.key] ?? ""
		const active = new Set(current.split(",").filter(Boolean))

		if (facet.type === "toggle") {
			return (
				<Button
					key={facet.key}
					variant={current === "1" ? "default" : "outline"}
					size="sm"
					className="h-8"
					onClick={() => setFilter(facet.key, current === "1" ? null : "1")}
				>
					{facet.label}
				</Button>
			)
		}

		if (facet.type === "select") {
			return (
				<Select
					key={facet.key}
					value={current || "all"}
					onValueChange={(v) =>
						setFilter(facet.key, !v || v === "all" ? null : v)
					}
					items={[
						{ value: "all", label: `Any ${facet.label.toLowerCase()}` },
						...optionsFor(facet).map((o) => ({
							value: o.value,
							label: o.label,
						})),
					]}
				>
					<SelectTrigger className="h-8 w-[140px]">
						<SelectValue placeholder={facet.label} />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">{`Any ${facet.label.toLowerCase()}`}</SelectItem>
						{optionsFor(facet).map((o) => (
							<SelectItem key={o.value} value={o.value}>
								{o.label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			)
		}

		if (facet.type === "chips") {
			return (
				<div key={facet.key} className="flex items-center gap-1">
					{optionsFor(facet).map((o) => (
						<button
							key={o.value}
							type="button"
							onClick={() =>
								setFilter(facet.key, toggleInList(current, o.value) || null)
							}
							className={cn(
								"inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors",
								active.has(o.value)
									? "border-foreground bg-foreground/5 text-foreground"
									: "text-muted-foreground hover:text-foreground",
							)}
						>
							{o.color && (
								<span className={cn("size-2 rounded-full", o.color)} />
							)}
							{o.label}
						</button>
					))}
				</div>
			)
		}

		const options = optionsFor(facet)
		if (options.length <= 1) return null
		return (
			<Popover key={facet.key}>
				<PopoverTrigger className="text-muted-foreground hover:text-foreground inline-flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-sm outline-none">
					{facet.label}
					{active.size > 0 && (
						<Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
							{active.size}
						</Badge>
					)}
					<ChevronDown className="size-3.5" />
				</PopoverTrigger>
				<PopoverContent align="start" className="w-52 space-y-1">
					{options.map((o) => (
						<label
							key={o.value}
							className="hover:bg-muted flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm"
						>
							<Checkbox
								checked={active.has(o.value)}
								onCheckedChange={() =>
									setFilter(facet.key, toggleInList(current, o.value) || null)
								}
							/>
							{o.label}
						</label>
					))}
				</PopoverContent>
			</Popover>
		)
	}

	return (
		<div className="space-y-3">
			<div className="flex flex-wrap items-center gap-2">
				<div className="relative max-w-xs flex-1">
					<Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
					<Input
						placeholder={searchPlaceholder}
						value={searchInput}
						onChange={(e) => setSearchInput(e.target.value)}
						className="h-8 pl-9"
					/>
				</div>
				<div className="ml-auto flex items-center gap-2">
					{presets.map((preset) => (
						<Button
							key={preset.key}
							variant="outline"
							size="sm"
							className="h-8"
							onClick={() => applyParams(preset.params)}
						>
							{preset.label}
						</Button>
					))}
					{exportHref && (
						<Button
							variant="outline"
							size="sm"
							className="h-8"
							nativeButton={false}
							render={<a href={exportHref} download />}
						>
							<Download className="size-3.5" />
							Export
						</Button>
					)}
					{columnToggles && columnVisibility && setColumnVisibility && (
						<ColumnVisibility
							columns={columnToggles}
							visibility={columnVisibility}
							onChange={setColumnVisibility}
						/>
					)}
				</div>
			</div>

			{facets.length > 0 && (
				<div className="flex flex-wrap items-center gap-2">
					{facets.map(renderFacet)}
					{hasFilters && (
						<Button
							variant="ghost"
							size="sm"
							className="h-8"
							onClick={clearAll}
						>
							<X className="size-3.5" />
							Clear
						</Button>
					)}
				</div>
			)}
		</div>
	)
}
