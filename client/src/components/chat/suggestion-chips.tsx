import { Button } from "@/components/ui/button";

interface SuggestionChip {
  text: string;
  onClick: () => void;
}

interface SuggestionChipsProps {
  suggestions: SuggestionChip[];
}

export function SuggestionChips({ suggestions }: SuggestionChipsProps) {
  return (
    <div className="flex flex-wrap gap-2 mb-6 ml-11">
      {suggestions.map((suggestion, index) => (
        <Button
          key={index}
          variant="outline"
          className="rounded-full px-4 py-2 text-sm h-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          onClick={suggestion.onClick}
        >
          {suggestion.text}
        </Button>
      ))}
    </div>
  );
}
