import React, { useState, useEffect } from 'react';
import { Trash2, FileText } from 'lucide-react';

// CORRECTION CRITIQUE : Utilisation stricte de localhost pour éviter les blocages inter-IP
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'localhost:5001';

// --- INTERFACE MISE À JOUR POUR CORRESPONDRE À LA DB SQLITE ---
interface DocumentItem {
    id: number;
    nom_fichier: string;
    chemin_local: string;
    date_ajout: string;
}

// ----------------------------------------------------------------------
// 1. Composant DocumentsPage
// ----------------------------------------------------------------------
interface DocumentsPageProps {
    currentCategory: string; // La catégorie à filtrer (ex: "Documents archivés")
    refreshKey: number;      // Clé pour forcer le rafraîchissement
    onDocumentClick: (doc: DocumentItem) => void; // Fonction pour ouvrir le visualiseur
}

const DocumentsPage: React.FC<DocumentsPageProps> = ({ currentCategory, refreshKey, onDocumentClick }) => {
    const [documents, setDocuments] = useState<DocumentItem[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState<boolean>(false);

    // URL de l'API Flask (Port 5001) pour la récupération
    const FETCH_API_URL = `${API_BASE_URL}/api/documents/${currentCategory}`;
    // URL de l'API Flask pour la suppression
    const DELETE_API_URL_BASE = `${API_BASE_URL}/api/documents`;

    // Fonction pour forcer le rafraîchissement après une action (suppression ou ajout)
    const [localRefresh, setLocalRefresh] = useState(0);

    const forceRefresh = () => {
        setLocalRefresh(prev => prev + 1);
    };

    // --- LOGIQUE DE SUPPRESSION ---
    const handleDelete = async (docId: number, docName: string) => {
        // Remplacer window.confirm() par une modale personnalisée dans une version finale.
        // Utilisation de console.log pour respecter les contraintes du Canvas (pas d'alert/confirm)
        if (!window.confirm(`Confirmation de suppression pour ${docName}.`)) {
             console.log("Suppression annulée par l'utilisateur.");
             return;
        }

        setIsDeleting(true);
        try {
            // 🚨 Appel DELETE à l'API sur le port 5001
            const response = await fetch(`${DELETE_API_URL_BASE}/${docId}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                console.log(`Document ${docId} supprimé avec succès.`);
                // 1. Mise à jour immédiate du DOM (pour une sensation de rapidité)
                setDocuments(prevDocs => prevDocs.filter(doc => doc.id !== docId));
                // 2. Forcer un rafraîchissement complet (en cas d'erreur de cache)
                forceRefresh();
            } else {
                // Tente de lire l'erreur renvoyée par Flask
                const errorData = await response.json().catch(() => ({ error: 'Erreur inconnue' }));
                throw new Error(`Échec de la suppression sur le serveur: ${errorData.error}`);
            }
        } catch (err) {
            console.error("Erreur lors de la suppression:", err);
            // Utilisation de console.error pour le débogage
            console.error(`Erreur de suppression: ${err instanceof Error ? err.message : 'Connexion impossible'}`);
        } finally {
            setIsDeleting(false);
        }
    };
    // --- FIN LOGIQUE DE SUPPRESSION ---

    // --- LOGIQUE DE CHARGEMENT DES DONNÉES ---
    useEffect(() => {
        const fetchDocuments = async () => {
            setLoading(true);
            try {
                // 🚨 Appel GET à l'API sur le port 5001
                const response = await fetch(FETCH_API_URL);

                if (!response.ok) {
                    throw new Error(`Erreur HTTP: ${response.status}`);
                }

                const data: any[] = await response.json();

                // Mappage des tuples Python en objets TypeScript
                const documentsMapped: DocumentItem[] = data.map(item => ({
                    id: item[0],
                    nom_fichier: item[1],
                    chemin_local: item[2],
                    date_ajout: item[3]
                }));

                setDocuments(documentsMapped);
                setError(null);
            } catch (err) {
                console.error("Erreur de récupération de l'API:", err);
                setError(`Impossible de charger les documents pour ${currentCategory}. Le serveur Flask est-il démarré ?`);
                setDocuments([]);
            } finally {
                setLoading(false);
            }
        };

        fetchDocuments();
    }, [currentCategory, refreshKey, localRefresh]); // Déclenchement au changement de catégorie, de clé globale, ou après suppression

    // Rendu d'affichage
    if (loading) return <div className="text-center py-8 text-indigo-600 text-sm sm:text-base">Chargement des documents...</div>;
    if (error) return <div className="bg-red-100 border border-red-400 text-red-700 px-3 sm:px-4 py-2 sm:py-3 rounded relative mt-4 text-xs sm:text-sm">Erreur: {error}</div>;

    return (
        <div className="space-y-4 pt-4">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-800 flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600 flex-shrink-0" />
                <span className="truncate">{currentCategory} ({documents.length} documents)</span>
            </h2>

            <div className="grid gap-3">
                {documents.length > 0 ? (
                    documents.map((doc) => {
                        return (
                            <div
                                key={doc.id}
                                className="bg-white rounded-xl p-3 sm:p-4 shadow-md hover:shadow-lg transition-shadow duration-300 w-full max-w-full overflow-hidden"
                            >
                                {/* Contenu principal */}
                                <div
                                    onClick={() => onDocumentClick(doc)}
                                    className="flex items-start gap-2 sm:gap-3 flex-1 min-w-0 p-2 -m-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer w-full max-w-full"
                                    title={`Ouvrir ${doc.nom_fichier}`}
                                >
                                    <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-500 flex-shrink-0 mt-0.5 sm:mt-1" />
                                    <div className="min-w-0 flex-1 w-full max-w-full">
                                        <h3 className="font-medium text-gray-900 break-words text-xs sm:text-base whitespace-normal">
                                            {doc.nom_fichier}
                                        </h3>
                                        <p className="text-xs text-gray-500 truncate hidden sm:block">
                                            Chemin: {doc.chemin_local}
                                        </p>
                                        <p className="text-xs text-gray-400 mt-1">
                                            {doc.date_ajout ? doc.date_ajout.substring(0, 10) : 'Date inconnue'}
                                        </p>
                                    </div>
                                </div>

                                {/* Bouton de suppression */}
                                <div className="flex justify-end mt-2 sm:mt-0">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDelete(doc.id, doc.nom_fichier);
                                        }}
                                        disabled={isDeleting}
                                        title={`Supprimer ${doc.nom_fichier}`}
                                        className={`text-red-500 p-2 rounded-full transition-colors hover:bg-red-100 flex-shrink-0 ${isDeleting ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="text-center py-8 text-gray-500 text-sm sm:text-base">
                        Aucun document n'a encore été ajouté dans cette catégorie.
                    </div>
                )}
            </div>
        </div>
    );
};

export default DocumentsPage;