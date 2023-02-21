import {
	DEFAULT_NAMESPACE,
	type DefaultResources,
	FALLBACK_LANGUAGES,
	FORMATTERS, LANGUAGES,
	NAMESPACES,
	RESOURCES,
	RETURN_NULL,
} from "assets/locales"
import { EventEmitterLite, anyToError, inSet } from "./utils/util"
import i18next, { createInstance, type i18n } from "i18next"
import type { TerminalPlugin } from "./main"
import { moment } from "obsidian"
import { printError } from "./utils/obsidian"
import resourcesToBackend from "i18next-resources-to-backend"

declare module "i18next" {
	interface CustomTypeOptions {
		readonly defaultNS: typeof DEFAULT_NAMESPACE
		readonly resources: DefaultResources
		readonly returnNull: typeof RETURN_NULL
	}
}

export const I18N = (async (): Promise<i18n> => {
	try {
		const missingTranslationKey = "errors.missing-translation"
		let missingInterpolationHandlerReentrant = false
		const ret = createInstance({
			cleanCode: true,
			defaultNS: DEFAULT_NAMESPACE,
			fallbackLng: FALLBACK_LANGUAGES,
			initImmediate: true,
			missingInterpolationHandler(text, value: RegExpExecArray) {
				if (missingInterpolationHandlerReentrant) {
					console.warn(value, text)
				} else {
					missingInterpolationHandlerReentrant = true
					try {
						console.warn(ret.t("errors.missing-interpolation", {
							interpolation: { escapeValue: false },
							name: value[1],
							text,
							value: value[0],
						}))
					} finally {
						missingInterpolationHandlerReentrant = false
					}
				}
				return value[0]
			},
			nonExplicitSupportedLngs: true,
			ns: NAMESPACES,
			parseMissingKeyHandler(key, defaultValue) {
				if (key === missingTranslationKey) {
					console.warn(key, defaultValue)
				} else {
					console.warn(ret.t(missingTranslationKey, {
						interpolation: { escapeValue: false },
						key,
						value: defaultValue ?? key,
					}))
				}
				return defaultValue ?? key
			},
			returnNull: RETURN_NULL,
		}).use(resourcesToBackend(async (
			language: string,
			namespace: string,
		) => {
			if (inSet(LANGUAGES, language)) {
				const lngRes = RESOURCES[language]
				if (namespace in lngRes) {
					return lngRes[namespace as keyof typeof lngRes]()
				}
			}
			return null
		}))
		await ret.init()
		const { services } = ret,
			{ formatter } = services
		for (const [key, value] of Object.entries(FORMATTERS)) {
			formatter?.addCached(key, value)
		}
		return ret
	} catch (error) {
		printError(anyToError(error), () => "i18n error")
		throw error
	}
})()

export class LanguageManager {
	public readonly onChangeLanguage = new EventEmitterLite<readonly [string]>()
	#i18n = i18next
	public constructor(protected readonly plugin: TerminalPlugin) { }

	public get i18n(): i18n {
		return this.#i18n
	}

	public get language(): string {
		const { language } = this.plugin.settings
		return language === "" ? moment.locale() : language
	}

	public async load(): Promise<void> {
		this.#i18n = await I18N
		await this.changeLanguage(this.language)
		this.plugin.register(this.plugin.on(
			"mutate-settings",
			() => this.language,
			async cur => this.changeLanguage(cur),
		))
	}

	protected async changeLanguage(language: string): Promise<void> {
		await this.i18n.changeLanguage(language)
		await this.onChangeLanguage.emit(language)
	}
}
