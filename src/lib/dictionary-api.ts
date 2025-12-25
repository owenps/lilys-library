// Response types from Free Dictionary API
interface DictionaryDefinition {
  definition: string
  example?: string
  synonyms: string[]
}

interface DictionaryMeaning {
  partOfSpeech: string
  definitions: DictionaryDefinition[]
}

interface DictionaryResponse {
  word: string
  phonetic?: string
  phonetics?: { text?: string; audio?: string }[]
  meanings: DictionaryMeaning[]
}

export interface SuggestedDefinition {
  definition: string
  partOfSpeech: string
  example?: string
  phonetic?: string
}

export async function lookupWord(word: string): Promise<SuggestedDefinition[]> {
  const trimmed = word.trim().toLowerCase()
  if (!trimmed) return []

  const response = await fetch(
    `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(trimmed)}`
  )

  if (!response.ok) {
    if (response.status === 404) {
      return [] // Word not found
    }
    throw new Error('Failed to lookup word')
  }

  const data: DictionaryResponse[] = await response.json()

  if (!data || data.length === 0) {
    return []
  }

  const entry = data[0]
  const phonetic = entry.phonetic || entry.phonetics?.find((p) => p.text)?.text

  // Flatten all definitions from all meanings
  const suggestions: SuggestedDefinition[] = []

  for (const meaning of entry.meanings) {
    for (const def of meaning.definitions.slice(0, 3)) {
      // Limit to 3 definitions per part of speech
      suggestions.push({
        definition: def.definition,
        partOfSpeech: meaning.partOfSpeech,
        example: def.example,
        phonetic,
      })
    }
  }

  return suggestions
}
