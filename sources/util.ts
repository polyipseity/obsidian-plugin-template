import { Notice, Plugin, type PluginManifest, type View } from "obsidian"
import { NOTICE_NO_TIMEOUT } from "./magic"
import type { TerminalPlugin } from "./main"

export type Immutable<T> = { readonly [key in keyof T]: Immutable<T[key]> }
export type Mutable<T> = { -readonly [key in keyof T]: Mutable<T[key]> }

export class UnnamespacedID<V extends string> {
	public constructor(public readonly id: V) { }

	public namespaced(plugin: Plugin | PluginManifest): string {
		return `${(plugin instanceof Plugin ? plugin.manifest : plugin).id}:${this.id}`
	}
}

export function commandNamer(
	cmdNamer: () => string,
	pluginNamer: () => string,
	defaultPluginName: string,
	format: string,
): () => string {
	const cmd = cmdNamer()
	return () => format
		.replace(cmd, cmdNamer())
		.replace(defaultPluginName, pluginNamer())
}

export function cloneAsMutable<T>(obj: T): Mutable<T> {
	// `readonly` is fake at runtime
	return structuredClone(obj) as Mutable<T>
}

export function saveFile(text: string, type = "text/plain;charset=UTF-8;", filename = ""): void {
	const ele = document.createElement("a")
	ele.target = "_blank"
	ele.download = filename
	const url = URL.createObjectURL(new Blob([text], { type }))
	try {
		ele.href = url
		ele.click()
	} finally {
		URL.revokeObjectURL(url)
	}
}

export function inSet<T>(set: readonly T[], obj: any): obj is T {
	return set.some(mem => obj === mem)
}

export function isInterface<T extends { readonly __type: T["__type"] }>(id: T["__type"], obj: any): obj is T {
	if (!("__type" in obj)) {
		return false
	}
	// eslint-disable-next-line no-underscore-dangle
	return (obj as { readonly __type: any }).__type === id
}

export function statusBar(callback?: (
	element: HTMLDivElement) => any): HTMLDivElement | null {
	const ret = document.querySelector<HTMLDivElement>(".app-container>div.status-bar")
	if (ret !== null) {
		(callback ?? ((): void => { }))(ret)
	}
	return ret
}

export function notice(
	message: () => DocumentFragment | string,
	timeout: number = NOTICE_NO_TIMEOUT,
	plugin?: TerminalPlugin,
): Notice {
	const timeoutMs = 1000 * timeout,
		ret = new Notice(message(), timeoutMs)
	if (typeof plugin === "undefined") {
		return ret
	}
	const unreg = plugin.language.registerUse(() => ret.setMessage(message()))
	try {
		if (timeoutMs === 0) {
			plugin.register(unreg)
		} else {
			window.setTimeout(unreg, timeoutMs)
		}
	} catch {
		unreg()
	}
	return ret
}

export function onVisible<E extends Element>(
	element: E,
	callback: (
		observer: IntersectionObserver,
		element: E,
		entry: IntersectionObserverEntry,
	) => any,
	transient = false,
): IntersectionObserver {
	const ret = new IntersectionObserver((ents, obsr) => {
		(transient
			? ents.reverse()
			: [ents.last() ?? { isIntersecting: false }])
			.some(ent => {
				if (ent.isIntersecting) {
					callback(obsr, element, ent)
					return true
				}
				return false
			})
	})
	ret.observe(element)
	return ret
}

export function openExternal(url?: URL | string): Window | null {
	return window.open(url, "_blank", "noreferrer")
}

export function printError(
	error: any,
	message = (): string => "",
	plugin?: TerminalPlugin,
): void {
	console.error(`${message()}\n`, error)
	notice(
		error instanceof Error
			? (): string => `${message()}\n${error.name}: ${error.message}`
			: (): string => `${message()}\n${String(error)}`,
		NOTICE_NO_TIMEOUT,
		plugin,
	)
}

export function updateDisplayText(view: View): boolean {
	const type = view.getViewType(),
		text = view.getDisplayText(),
		header = document.querySelector(`.workspace-tab-header[data-type="${type}"]`),
		title = header?.querySelector(".workspace-tab-header-inner-title") ?? null,
		oldText = title?.textContent ?? null
	if (oldText === null) {
		return false
	}
	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	title!.textContent = text
	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	header!.ariaLabel = text
	document.title = document.title.replace(oldText, text)
	return true
}
