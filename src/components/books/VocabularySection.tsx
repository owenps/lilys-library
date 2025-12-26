import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { Plus, Edit, Trash2, Loader2, BookOpen, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  useVocabulary,
  useCreateVocabulary,
  useDeleteVocabulary,
  useUpdateVocabulary,
  useDictionaryLookup,
} from '@/hooks/useVocabulary'
import type { Vocabulary } from '@/types/database'
import { toast } from 'sonner'

interface VocabularySectionProps {
  bookId: string
}

export function VocabularySection({ bookId }: VocabularySectionProps) {
  const { vocabulary } = useVocabulary(bookId)
  const createVocabulary = useCreateVocabulary()
  const deleteVocabulary = useDeleteVocabulary()
  const updateVocabulary = useUpdateVocabulary()

  // Form state
  const [newTerm, setNewTerm] = useState('')
  const [newDefinition, setNewDefinition] = useState('')
  const [vocabPageNumber, setVocabPageNumber] = useState('')
  const [selectedPartOfSpeech, setSelectedPartOfSpeech] = useState('')
  const [selectedPhonetic, setSelectedPhonetic] = useState('')
  const [selectedExample, setSelectedExample] = useState('')

  // Editing state
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTerm, setEditTerm] = useState('')
  const [editDefinition, setEditDefinition] = useState('')
  const [editPageNumber, setEditPageNumber] = useState('')
  const [editPartOfSpeech, setEditPartOfSpeech] = useState('')

  // Dictionary lookup with debounce
  const [debouncedTerm, setDebouncedTerm] = useState('')
  const [hideSuggestions, setHideSuggestions] = useState(false)
  const { data: suggestions, isLoading: isLookingUp } = useDictionaryLookup(debouncedTerm)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTerm(newTerm)
    }, 500)
    // Show suggestions again when term changes
    setHideSuggestions(false)
    return () => clearTimeout(timer)
  }, [newTerm])

  const handleAddVocabulary = async () => {
    if (!newTerm.trim() || !newDefinition.trim()) return

    try {
      await createVocabulary.mutateAsync({
        bookId,
        term: newTerm.trim(),
        definition: newDefinition.trim(),
        partOfSpeech: selectedPartOfSpeech || undefined,
        phonetic: selectedPhonetic || undefined,
        example: selectedExample || undefined,
        pageNumber: vocabPageNumber ? parseInt(vocabPageNumber) : undefined,
      })

      // Reset form
      setNewTerm('')
      setNewDefinition('')
      setVocabPageNumber('')
      setSelectedPartOfSpeech('')
      setSelectedPhonetic('')
      setSelectedExample('')
      toast.success('Word added to vocabulary')
    } catch {
      toast.error('Failed to add word')
    }
  }

  const handleSelectSuggestion = (suggestion: NonNullable<typeof suggestions>[0]) => {
    setNewDefinition(suggestion.definition)
    setSelectedPartOfSpeech(suggestion.partOfSpeech)
    setSelectedPhonetic(suggestion.phonetic || '')
    setSelectedExample(suggestion.example || '')
    setHideSuggestions(true)
  }

  const handleEditVocabulary = (item: Vocabulary) => {
    setEditingId(item.id)
    setEditTerm(item.term)
    setEditDefinition(item.definition)
    setEditPageNumber(item.page_number?.toString() || '')
    setEditPartOfSpeech(item.part_of_speech || '')
  }

  const handleSaveEdit = async () => {
    if (!editingId || !editTerm.trim() || !editDefinition.trim()) return

    try {
      await updateVocabulary.mutateAsync({
        vocabularyId: editingId,
        bookId,
        term: editTerm.trim(),
        definition: editDefinition.trim(),
        partOfSpeech: editPartOfSpeech || undefined,
        pageNumber: editPageNumber ? parseInt(editPageNumber) : null,
      })
      setEditingId(null)
      toast.success('Word updated')
    } catch {
      toast.error('Failed to update word')
    }
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditTerm('')
    setEditDefinition('')
    setEditPageNumber('')
    setEditPartOfSpeech('')
  }

  const handleDeleteVocabulary = async (id: string) => {
    try {
      await deleteVocabulary.mutateAsync(id)
      toast.success('Word removed')
    } catch {
      toast.error('Failed to remove word')
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Add Vocabulary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Input
              placeholder="Enter a word..."
              value={newTerm}
              onChange={(e) => setNewTerm(e.target.value)}
            />

            {/* Suggestions from dictionary API */}
            {isLookingUp && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Looking up definition...
              </div>
            )}

            {suggestions && suggestions.length > 0 && newTerm.trim() && !isLookingUp && !hideSuggestions && (
              <div className="border rounded-lg p-2 space-y-1 bg-muted/50">
                <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  Suggested definitions
                </p>
                {suggestions.slice(0, 5).map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSelectSuggestion(suggestion)}
                    className="w-full text-left p-2 rounded hover:bg-accent text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {suggestion.partOfSpeech}
                      </Badge>
                      {suggestion.phonetic && (
                        <span className="text-muted-foreground text-xs">
                          {suggestion.phonetic}
                        </span>
                      )}
                    </div>
                    <p className="mt-1">{suggestion.definition}</p>
                    {suggestion.example && (
                      <p className="text-muted-foreground text-xs mt-1 italic">
                        &ldquo;{suggestion.example}&rdquo;
                      </p>
                    )}
                  </button>
                ))}
              </div>
            )}

            {suggestions && suggestions.length === 0 && newTerm.trim().length >= 2 && !isLookingUp && (
              <p className="text-xs text-muted-foreground">
                No definitions found. You can add your own below.
              </p>
            )}
          </div>

          <Textarea
            placeholder="Definition..."
            value={newDefinition}
            onChange={(e) => setNewDefinition(e.target.value)}
            rows={2}
          />

          <div className="flex gap-2">
            <Select
              value={selectedPartOfSpeech}
              onValueChange={setSelectedPartOfSpeech}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Part of speech" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="noun">noun</SelectItem>
                <SelectItem value="verb">verb</SelectItem>
                <SelectItem value="adjective">adjective</SelectItem>
                <SelectItem value="adverb">adverb</SelectItem>
                <SelectItem value="pronoun">pronoun</SelectItem>
                <SelectItem value="preposition">preposition</SelectItem>
                <SelectItem value="conjunction">conjunction</SelectItem>
                <SelectItem value="interjection">interjection</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="number"
              placeholder="Page"
              value={vocabPageNumber}
              onChange={(e) => setVocabPageNumber(e.target.value)}
              className="flex-1"
            />
            <Button
              size="icon"
              onClick={handleAddVocabulary}
              disabled={!newTerm.trim() || !newDefinition.trim() || createVocabulary.isPending}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Vocabulary List */}
      {vocabulary.length > 0 ? (
        <div className="space-y-3">
          {vocabulary.map((item) => {
            const isEditing = editingId === item.id

            return (
              <Card key={item.id}>
                <CardContent className="pt-4">
                  {isEditing ? (
                    <div className="space-y-3">
                      <Input
                        value={editTerm}
                        onChange={(e) => setEditTerm(e.target.value)}
                        placeholder="Term"
                      />
                      <Textarea
                        value={editDefinition}
                        onChange={(e) => setEditDefinition(e.target.value)}
                        placeholder="Definition"
                        rows={2}
                      />
                      <div className="flex gap-2">
                        <Select
                          value={editPartOfSpeech}
                          onValueChange={setEditPartOfSpeech}
                        >
                          <SelectTrigger className="w-[140px]">
                            <SelectValue placeholder="Part of speech" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="noun">noun</SelectItem>
                            <SelectItem value="verb">verb</SelectItem>
                            <SelectItem value="adjective">adjective</SelectItem>
                            <SelectItem value="adverb">adverb</SelectItem>
                            <SelectItem value="pronoun">pronoun</SelectItem>
                            <SelectItem value="preposition">preposition</SelectItem>
                            <SelectItem value="conjunction">conjunction</SelectItem>
                            <SelectItem value="interjection">interjection</SelectItem>
                          </SelectContent>
                        </Select>
                        <Input
                          type="number"
                          placeholder="Page"
                          value={editPageNumber}
                          onChange={(e) => setEditPageNumber(e.target.value)}
                          className="w-24"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={handleSaveEdit}
                          disabled={updateVocabulary.isPending}
                        >
                          Save
                        </Button>
                        <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold">{item.term}</span>
                          {item.phonetic && (
                            <span className="text-muted-foreground text-sm">
                              {item.phonetic}
                            </span>
                          )}
                          {item.part_of_speech && (
                            <Badge variant="outline" className="text-xs">
                              {item.part_of_speech}
                            </Badge>
                          )}
                        </div>
                        <p className="mt-1 text-sm">{item.definition}</p>
                        {item.example && (
                          <p className="mt-1 text-sm text-muted-foreground italic">
                            &ldquo;{item.example}&rdquo;
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                          {item.page_number && <span>Page {item.page_number}</span>}
                          <span>{format(new Date(item.created_at), 'MMM d, yyyy')}</span>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditVocabulary(item)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteVocabulary(item.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-8">
          <BookOpen className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
          <p className="text-muted-foreground">
            No vocabulary yet. Add words you discover while reading!
          </p>
        </div>
      )}
    </>
  )
}
