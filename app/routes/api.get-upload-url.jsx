import { json } from "@remix-run/node";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export async function action({ request }) {
  // 1. Récupération du nom et du type du fichier depuis le frontend
  const formData = await request.formData();
  const fileName = formData.get("fileName");
  const fileType = formData.get("fileType");

  // 2. Connexion à votre compte Amazon S3 via les clés du fichier .env
  const s3Client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  });

  // 3. Création du nom unique pour la vidéo (ex: videos/171249302-mavideo.mp4)
  const fileKey = `videos/${Date.now()}-${fileName}`;

  const command = new PutObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: fileKey,
    ContentType: fileType, // Indispensable pour que la vidéo se lise dans le navigateur
  });

  // 4. Génération du ticket pré-signé valide pour 15 minutes
  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 900 });

  // 5. Fabrication du lien final public où sera visible la vidéo
  const finalVideoUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileKey}`;

  return json({ uploadUrl, finalVideoUrl });
}