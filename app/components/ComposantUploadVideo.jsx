import { useState } from "react";

export default function ComposantUploadVideo({ onUploadComplete }) {
  const [statut, setStatut] = useState(""); // Pour afficher un message à l'utilisateur
  const [lienVideo, setLienVideo] = useState(null); // Pour stocker le lien final
  const [isUploading, setIsUploading] = useState(false);

  const gererUpload = async (event) => {
    const fichier = event.target.files[0];
    if (!fichier) return;

    try {
      setIsUploading(true);
      setStatut("1/2 : Demande d'autorisation au serveur...");
      
      // 1. Préparer les infos du fichier pour notre API
      const formData = new FormData();
      formData.append("fileName", fichier.name);
      formData.append("fileType", fichier.type);

      // 2. Demander le lien pré-signé à la route que vous venez de créer
      const response = await fetch("/api/get-upload-url", {
        method: "POST",
        body: formData,
      });
      const { uploadUrl, finalVideoUrl } = await response.json();

      setStatut("2/2 : Envoi direct de la vidéo vers AWS en cours...");

      // 3. Envoyer le fichier DIRECTEMENT sur Amazon S3
      const s3Upload = await fetch(uploadUrl, {
        method: "PUT",
        body: fichier,
        headers: {
          "Content-Type": fichier.type,
        },
      });

      if (s3Upload.ok) {
        setStatut("✅ Upload terminé avec succès !");
        setLienVideo(finalVideoUrl);
        if (onUploadComplete) {
          onUploadComplete(finalVideoUrl);
        }
      } else {
        setStatut("❌ Erreur lors de l'envoi sur les serveurs.");
      }
    } catch (erreur) {
      console.error(erreur);
      setStatut("❌ Un problème est survenu.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div style={{ padding: "20px", border: "1px solid #ccc", borderRadius: "8px", margin: "10px 0" }}>
      <h3 style={{ margin: "0 0 10px 0", fontSize: "16px", fontWeight: "bold" }}>Ajouter une vidéo Wameet / Nanasore</h3>
      
      {/* Le bouton pour choisir le fichier */}
      <input 
        type="file" 
        accept="video/mp4,video/x-m4v,video/quicktime,video/webm,video/*" 
        onChange={gererUpload}
        disabled={isUploading}
      />
      
      {/* Affichage des messages de progression */}
      {statut && <p style={{ marginTop: "10px", fontSize: "14px" }}><strong>Statut :</strong> {statut}</p>}

      {/* Affichage de la vidéo une fois l'upload terminé */}
      {lienVideo && (
        <div style={{ marginTop: "15px" }}>
          <p style={{ fontSize: "12px", wordBreak: "break-all" }}>
            Lien public de votre vidéo : <a href={lienVideo} target="_blank" rel="noreferrer" style={{ color: "#2563EB" }}>{lienVideo}</a>
          </p>
          <video src={lienVideo} width="100%" style={{ maxHeight: "300px", borderRadius: "8px", backgroundColor: "#000" }} controls />
        </div>
      )}
    </div>
  );
}
