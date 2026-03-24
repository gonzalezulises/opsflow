import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, BookOpen, Video, FileDown, Library } from "lucide-react";
import { INDUSTRY_RESOURCES } from "@/lib/constants/industry-resources";

function typeIcon(type: string) {
  switch (type) {
    case "Video": return <Video className="size-3.5" />;
    case "Herramienta": return <FileDown className="size-3.5" />;
    default: return <BookOpen className="size-3.5" />;
  }
}

export default function ResourcesPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Recursos por industria</h1>
        <p className="text-muted-foreground">
          Material especializado según tu sector — con analogías al caso base del bootcamp
        </p>
      </div>

      <Card className="border-primary/20 bg-primary/[0.02]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Library className="size-4 text-primary" />
            ¿Cómo usar estos recursos?
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground leading-relaxed space-y-2">
          <p>
            El caso base del bootcamp (Alimentos Santa Emilia — Pedido a Despacho) es un proceso
            universal: todas las industrias tienen un flujo equivalente con esperas, retrabajo
            y desperdicios similares.
          </p>
          <p>
            Cada sección incluye una <strong>analogía directa</strong> entre el caso base y tu
            industria, más recursos especializados para que profundices en las mejores prácticas
            de tu sector.
          </p>
        </CardContent>
      </Card>

      <div className="space-y-6">
        {INDUSTRY_RESOURCES.map((industry) => {
          const Icon = industry.icon;
          return (
            <Card key={industry.id} id={industry.id}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className={`flex size-10 items-center justify-center rounded-lg bg-muted ${industry.color}`}>
                    <Icon className="size-5" />
                  </div>
                  <div>
                    <CardTitle>{industry.name}</CardTitle>
                    <CardDescription>{industry.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Analogía del caso base */}
                <div className="rounded-lg border border-primary/20 bg-primary/[0.03] p-4">
                  <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">
                    Analogía con el caso base
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {industry.caseAnalogy}
                  </p>
                </div>

                {/* Recursos */}
                <div className="grid gap-3 sm:grid-cols-2">
                  {industry.resources.map((item) => (
                    <a
                      key={item.title}
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group block rounded-lg border p-3 transition-colors hover:bg-muted/50 hover:border-primary/30"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium group-hover:text-primary transition-colors">
                              {item.title}
                            </p>
                            <ExternalLink className="size-3 shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">{item.author}</p>
                          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                            {item.description}
                          </p>
                        </div>
                        <Badge variant="outline" className="shrink-0 gap-1 text-xs">
                          {typeIcon(item.type)}
                          {item.type}
                        </Badge>
                      </div>
                    </a>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
