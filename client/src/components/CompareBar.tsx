import { Button } from "@/components/ui/button";
import { X, GitCompare, Trash2 } from "lucide-react";
import { useCompare } from "@/contexts/CompareContext";
import { useLocation } from "wouter";

export function CompareBar() {
  const { compareList, removeFromCompare, clearCompare, maxCompareItems } =
    useCompare();
  const [, setLocation] = useLocation();

  if (compareList.length === 0) {
    return null;
  }

  return (
    <div
      className="fixed bottom-16 md:bottom-0 left-0 right-0 z-50 bg-background border-t shadow-lg"
      data-testid="compare-bar"
    >
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <GitCompare className="h-5 w-5 text-primary" />
            <span className="font-medium text-sm">
              Compare ({compareList.length}/{maxCompareItems})
            </span>
          </div>

          <div className="flex items-center gap-2 flex-1 overflow-x-auto py-1">
            {compareList.map((property) => (
              <div
                key={property.id}
                className="flex items-center gap-2 bg-muted rounded-lg px-3 py-1.5 flex-shrink-0"
                data-testid={`compare-item-${property.id}`}
              >
                <img
                  src={property.images?.[0] || "/placeholder-property.jpg"}
                  alt={property.title}
                  className="w-8 h-8 rounded object-cover"
                />
                <span className="text-sm font-medium max-w-[120px] truncate">
                  {property.title}
                </span>
                <button
                  onClick={() => removeFromCompare(property.id)}
                  className="text-muted-foreground hover:text-foreground"
                  data-testid={`remove-compare-${property.id}`}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={clearCompare}
              data-testid="button-clear-compare"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Clear
            </Button>
            <Button
              size="sm"
              onClick={() => setLocation("/compare")}
              disabled={compareList.length < 2}
              data-testid="button-compare-now"
            >
              <GitCompare className="h-4 w-4 mr-1" />
              Compare Now
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
