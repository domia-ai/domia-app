import type { ComponentType, ReactNode } from "react"

export type ChartThemeName = "light" | "dark"

export type ChartTooltipNameType = number | string

export type ChartConfig = Record<
	string,
	{
		label?: ReactNode
		icon?: ComponentType
	} & (
		| { color?: string; theme?: never }
		| { color?: never; theme: Record<ChartThemeName, string> }
	)
>

export type ChartContextProps = {
	config: ChartConfig
}

export type SidebarContextProps = {
	state: "expanded" | "collapsed"
	open: boolean
	setOpen: (open: boolean) => void
	openMobile: boolean
	setOpenMobile: (open: boolean) => void
	isMobile: boolean
	toggleSidebar: () => void
}
