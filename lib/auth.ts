import type { UserRole } from "@/types/models";

export function canEdit(role: UserRole | undefined): boolean {
  return role === "admin" || role === "editor";
}

export function roleLabel(role: UserRole): string {
  switch (role) {
    case "admin":
      return "Administrador";
    case "editor":
      return "Editor";
    case "visualizacao":
      return "Visualização";
    default:
      return "—";
  }
}
