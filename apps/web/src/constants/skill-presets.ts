import { Home, Server } from "lucide-react"
import { m } from "@/paraglide/messages"
import type { SkillPreset } from "@/types/config"

export const SKILL_PRESETS: SkillPreset[] = [
	{
		id: "home-assistant",
		labelKey: m.config_preset_home_assistant,
		descriptionKey: m.config_preset_home_assistant_desc,
		icon: Home,
		draft: {
			name: "home-assistant",
			protocol: "mcp",
			type: "sse",
			url: "https://homeassistant.local:8123/mcp_server/sse",
			authKind: "bearer",
			whitelist: [
				"HassTurnOn",
				"HassTurnOff",
				"HassLightSet",
				"GetLiveContext",
			],
			config: "",
			descriptor: {
				version: 1,
				kind: "home-assistant",
				execution: {
					paramAllow: {
						"*": ["name"],
						HassLightSet: ["name", "brightness", "color"],
					},
				},
			},
		},
	},
	{
		id: "generic-mcp",
		labelKey: m.config_preset_generic_mcp,
		descriptionKey: m.config_preset_generic_mcp_desc,
		icon: Server,
		draft: {
			name: "",
			protocol: "mcp",
			type: "http",
			url: "http://localhost:9099/mcp",
			authKind: "none",
			whitelist: [],
			config: "",
			descriptor: undefined,
		},
	},
]
