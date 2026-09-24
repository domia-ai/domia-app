import { Home, Music, Server } from "lucide-react"
import { m } from "@/paraglide/messages"
import type { SkillPreset } from "@/types/config"

const HA_LIGHT_SET_TOOL = "light__HassLightSet"

const HOME_ASSISTANT_TOOL_WHITELIST = [
	"intent__HassTurnOn",
	"intent__HassTurnOff",
	HA_LIGHT_SET_TOOL,
	"homeassistant__GetLiveContext",
]

const MUSIC_ASSISTANT_TOOL_WHITELIST = [
	"playback_pause",
	"playback_resume",
	"playback_next_track",
	"playback_previous_track",
	"volume_volume_set",
	"volume_volume_up",
	"volume_volume_down",
	"volume_volume_mute",
]

export const SKILL_PRESETS: SkillPreset[] = [
	{
		id: "home-assistant",
		labelKey: m.config_preset_home_assistant,
		descriptionKey: m.config_preset_home_assistant_desc,
		hintKey: m.config_skill_preset_hint,
		icon: Home,
		draft: {
			name: "home-assistant",
			protocol: "mcp",
			type: "http",
			url: "http://homeassistant.local:8123/api/mcp",
			authKind: "bearer",
			whitelist: HOME_ASSISTANT_TOOL_WHITELIST,
			config: "",
			descriptor: {
				version: 1,
				kind: "home-assistant",
				execution: {
					paramAllow: {
						"*": ["name"],
						[HA_LIGHT_SET_TOOL]: ["name", "brightness", "color"],
					},
				},
			},
		},
	},
	{
		id: "music-assistant",
		labelKey: m.config_preset_music_assistant,
		descriptionKey: m.config_preset_music_assistant_desc,
		hintKey: m.config_skill_music_hint,
		icon: Music,
		draft: {
			name: "music",
			protocol: "mcp",
			type: "http",
			url: "http://homeassistant.local:8095/mcp/v1",
			authKind: "bearer",
			whitelist: MUSIC_ASSISTANT_TOOL_WHITELIST,
			config: "",
			descriptor: {
				version: 1,
				kind: "music-assistant",
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

export const SKILL_DESCRIPTOR_KINDS: { id: string; label: () => string }[] = [
	...SKILL_PRESETS.flatMap((preset) => {
		const kind = preset.draft.descriptor?.kind
		return kind ? [{ id: kind, label: preset.labelKey }] : []
	}),
	{ id: "domia", label: m.config_preset_domia },
]
