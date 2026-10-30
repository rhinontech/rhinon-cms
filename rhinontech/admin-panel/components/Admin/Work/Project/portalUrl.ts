/** "Rhinon CMS" → "rhinon-cms". Cosmetic: the id in the portal URL is what loads the project. */
export function projectSlug(name: string): string {
  return (
    name
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/[\s-]+/g, "-")
      .slice(0, 60)
      .replace(/-+$/, "") || "project"
  );
}

/** The client portal link: /public/<project-name>/<id>. */
export const portalPath = (name: string, id: string) => `/public/${projectSlug(name)}/${id}`;
