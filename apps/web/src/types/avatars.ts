export type AvatarPreset = {
	id: string
	label: string
}

export type SetAvatarInput =
	| { domiaKey: string; kind: "preset"; presetId: string }
	| { domiaKey: string; kind: "custom"; dataBase64: string; mime: string }
	| { domiaKey: string; kind: "clear" }

export type SetAvatarResult =
	| { ok: true; avatarId: string | null }
	| { ok: false; error: string }
