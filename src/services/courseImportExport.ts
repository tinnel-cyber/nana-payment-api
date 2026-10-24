/**
 * Service d'Import / Export JSON de la Structure des Cours
 * ENTREPRISE KONKOBO POUSBILA — NaNa Academy
 */

export interface ExportedCoursePayload {
  version: string;
  exportedAt: number;
  course: {
    id: string;
    title: string;
    tagline?: string;
    description?: string;
    price?: number;
    currency?: string;
    category?: string;
    level?: string;
    prerequisiteCourseIds?: string[];
    isPasswordProtected?: boolean;
    accessPassword?: string;
    strictLinearProgression?: boolean;
    modules?: any[];
    nodes?: any[];
    edges?: any[];
  };
}

/**
 * Exporte la structure complète du cours en fichier JSON téléchargeable
 */
export function exportCourseToJson(courseData: any, nodes?: any[], edges?: any[]): boolean {
  try {
    const courseId = courseData.id || 'cours-nana';
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const safeTitle = (courseData.title || 'cours')
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, '_')
      .slice(0, 30);

    const payload: ExportedCoursePayload = {
      version: '2.0-nana-forge',
      exportedAt: Date.now(),
      course: {
        id: courseData.id || `course-${Date.now()}`,
        title: courseData.title || 'Cours sans titre',
        tagline: courseData.tagline || '',
        description: courseData.description || '',
        price: courseData.price || 0,
        currency: courseData.currency || 'XOF',
        category: courseData.category || 'Fintech & Telecom',
        level: courseData.level || 'DEBUTANT',
        prerequisiteCourseIds: courseData.prerequisiteCourseIds || [],
        isPasswordProtected: !!courseData.isPasswordProtected,
        accessPassword: courseData.accessPassword || '',
        strictLinearProgression: !!courseData.strictLinearProgression,
        modules: courseData.modules || [],
        nodes: nodes || courseData.nodes || [],
        edges: edges || courseData.edges || []
      }
    };

    const jsonString = JSON.stringify(payload, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `nana_course_${safeTitle}_${timestamp}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return true;
  } catch (err) {
    console.error("Erreur lors de l'exportation JSON du cours:", err);
    return false;
  }
}

/**
 * Parse et valide le contenu JSON d'un cours importé
 */
export function parseAndValidateCourseJson(jsonString: string): { 
  success: boolean; 
  data?: ExportedCoursePayload['course']; 
  error?: string;
  summary?: { modulesCount: number; lessonsCount: number; nodesCount: number };
} {
  try {
    if (!jsonString || typeof jsonString !== 'string') {
      return { success: false, error: 'Le fichier est vide ou corrompu.' };
    }

    const parsed = JSON.parse(jsonString);

    // Support des deux formats : conteneur { course: { ... } } ou format direct { id, title, modules }
    const course = parsed.course || parsed;

    if (!course || typeof course !== 'object') {
      return { success: false, error: 'Structure JSON invalide : objet cours introuvable.' };
    }

    if (!course.title || typeof course.title !== 'string') {
      return { success: false, error: 'Le cours importé doit posséder un titre valide.' };
    }

    const modules = Array.isArray(course.modules) ? course.modules : [];
    const nodes = Array.isArray(course.nodes) ? course.nodes : [];

    // Compter les leçons à travers les modules
    let lessonsCount = 0;
    modules.forEach((m: any) => {
      if (Array.isArray(m.lessons)) {
        lessonsCount += m.lessons.length;
      }
    });

    return {
      success: true,
      data: {
        id: course.id || `course-${Date.now()}`,
        title: course.title,
        tagline: course.tagline || '',
        description: course.description || '',
        price: Number(course.price) || 0,
        currency: course.currency || 'XOF',
        category: course.category || 'Fintech & Telecom',
        level: course.level || 'DEBUTANT',
        prerequisiteCourseIds: Array.isArray(course.prerequisiteCourseIds) ? course.prerequisiteCourseIds : [],
        isPasswordProtected: !!course.isPasswordProtected,
        accessPassword: course.accessPassword || '',
        strictLinearProgression: !!course.strictLinearProgression,
        modules: modules,
        nodes: nodes,
        edges: Array.isArray(course.edges) ? course.edges : []
      },
      summary: {
        modulesCount: modules.length,
        lessonsCount: lessonsCount,
        nodesCount: nodes.length
      }
    };
  } catch (err: any) {
    return {
      success: false,
      error: `Erreur de syntaxe JSON : ${err?.message || 'Format de fichier non reconnu'}`
    };
  }
}
