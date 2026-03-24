"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Trash2, Users } from "lucide-react";

interface TeamMember {
  id: string;
  name: string;
  role: string;
  team: string;
}

const ROLES = ["Facilitador", "Participante", "Observador"];

export default function TeamPage() {
  const [members, setMembers] = useState<TeamMember[]>([
    { id: "1", name: "Facilitador principal", role: "Facilitador", team: "Equipo A" },
  ]);
  const [teams, setTeams] = useState<string[]>(["Equipo A"]);
  const [showAddMember, setShowAddMember] = useState(false);
  const [showAddTeam, setShowAddTeam] = useState(false);
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState("Participante");
  const [newTeam, setNewTeam] = useState("");
  const [selectedTeam, setSelectedTeam] = useState("Equipo A");

  function addMember() {
    if (!newName.trim()) return;
    setMembers((prev) => [
      ...prev,
      { id: crypto.randomUUID(), name: newName, role: newRole, team: selectedTeam },
    ]);
    setNewName("");
    setNewRole("Participante");
    setShowAddMember(false);
  }

  function addTeam() {
    if (!newTeam.trim() || teams.includes(newTeam)) return;
    setTeams((prev) => [...prev, newTeam]);
    setNewTeam("");
    setShowAddTeam(false);
  }

  function removeMember(id: string) {
    setMembers((prev) => prev.filter((m) => m.id !== id));
  }

  function roleColor(role: string) {
    switch (role) {
      case "Facilitador": return "default" as const;
      case "Participante": return "secondary" as const;
      case "Observador": return "outline" as const;
      default: return "secondary" as const;
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Equipo</h1>
          <p className="text-muted-foreground">
            Gestiona equipos y participantes del bootcamp
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowAddTeam(true)}>
            <Plus className="mr-2 size-4" />
            Nuevo equipo
          </Button>
          <Button onClick={() => setShowAddMember(true)}>
            <Plus className="mr-2 size-4" />
            Agregar miembro
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Equipos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{teams.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Participantes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{members.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Roles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-1">
              <Badge variant="default">{members.filter((m) => m.role === "Facilitador").length} Fac.</Badge>
              <Badge variant="secondary">{members.filter((m) => m.role === "Participante").length} Part.</Badge>
              <Badge variant="outline">{members.filter((m) => m.role === "Observador").length} Obs.</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {teams.map((team) => {
        const teamMembers = members.filter((m) => m.team === team);
        return (
          <Card key={team}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="size-4" />
                  {team}
                </CardTitle>
                <Badge variant="outline">{teamMembers.length} miembros</Badge>
              </div>
              <CardDescription>Equipo de trabajo</CardDescription>
            </CardHeader>
            <CardContent>
              {teamMembers.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Sin miembros aún. Agrega participantes a este equipo.
                </p>
              ) : (
                <div className="space-y-2">
                  {teamMembers.map((member) => (
                    <div key={member.id} className="flex items-center justify-between rounded-lg border p-3">
                      <div className="flex items-center gap-3">
                        <div className="flex size-8 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
                          {member.name.charAt(0).toUpperCase()}
                        </div>
                        <p className="text-sm font-medium">{member.name}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={roleColor(member.role)}>{member.role}</Badge>
                        <Button variant="ghost" size="icon" onClick={() => removeMember(member.id)}>
                          <Trash2 className="size-4 text-muted-foreground" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}

      <Dialog open={showAddMember} onOpenChange={setShowAddMember}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agregar miembro</DialogTitle>
            <DialogDescription>Agrega un participante al equipo</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Nombre</Label>
              <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Nombre del participante" />
            </div>
            <div className="space-y-2">
              <Label>Rol</Label>
              <select value={newRole} onChange={(e) => setNewRole(e.target.value)} className="flex h-9 w-full rounded-md border bg-background px-3 py-1 text-sm">
                {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Equipo</Label>
              <select value={selectedTeam} onChange={(e) => setSelectedTeam(e.target.value)} className="flex h-9 w-full rounded-md border bg-background px-3 py-1 text-sm">
                {teams.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <Button onClick={addMember} className="w-full">Agregar</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showAddTeam} onOpenChange={setShowAddTeam}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuevo equipo</DialogTitle>
            <DialogDescription>Crea un equipo de trabajo</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Nombre del equipo</Label>
              <Input value={newTeam} onChange={(e) => setNewTeam(e.target.value)} placeholder="Ej: Equipo B" />
            </div>
            <Button onClick={addTeam} className="w-full">Crear equipo</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
