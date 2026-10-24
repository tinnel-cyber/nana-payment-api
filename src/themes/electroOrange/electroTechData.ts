import { StoreProductItem } from '../../components/storeBuilder/types';
import {
  ELECTRO_XBOX_CONTROLLER_SVG,
  ELECTRO_SPEAKER_OVAL_SVG,
  ELECTRO_SMARTPHONE_GOLD_SVG,
  ELECTRO_REVERSIBLE_LAPTOP_SVG,
  ELECTRO_NX_CAMERA_SVG,
  ELECTRO_PRINTER_SVG,
  ELECTRO_USB_DRIVE_SVG,
  ELECTRO_VR_HEADSET_SVG,
  ELECTRO_SMARTWATCH_DUO_SVG,
  ELECTRO_HEADPHONES_HERO_SVG
} from './electroOrangeAssets';

// Données du produit de l'Offre Spéciale (Image 2 & 3)
export const SPECIAL_OFFER_DEFAULT: StoreProductItem & {
  available: number;
  alreadySold: number;
  discountAmount: number;
} = {
  id: 'special-deal-controller',
  name: 'Game Console Controller + USB 3.0 Cable',
  category: 'Jeux Vidéo & Accessoires',
  price: 49000,
  originalPrice: 65000,
  image: ELECTRO_XBOX_CONTROLLER_SVG,
  description: 'Contrôleur ergonomique haute précision avec sticks analogiques anti-dérive, D-Pad réactif et câble blindé USB 3.0.',
  currency: 'XOF',
  stock: 6,
  isFeatured: true,
  available: 6,
  alreadySold: 28,
  discountAmount: 16000
};

// Données de secours tech pour la grille à onglets (6 produits)
export const ELECTRO_SHOWCASE_PRODUCTS: StoreProductItem[] = [
  {
    id: 'tech-speaker-360',
    name: 'Wireless Audio System Multiroom 360 degree Full Sound',
    category: 'Speakers & Audio',
    price: 185000,
    originalPrice: 220000,
    image: ELECTRO_SPEAKER_OVAL_SVG,
    description: 'Système acoustique ovoïde 360° avec connexion Wi-Fi et Bluetooth aptX sans latence.',
    currency: 'XOF',
    stock: 12,
    isFeatured: true
  },
  {
    id: 'tech-revolve-810',
    name: 'Tablet White EliteBook Revolve 810 G2 Touchscreen',
    category: 'Laptops & Computers',
    price: 349000,
    originalPrice: 420000,
    image: ELECTRO_REVERSIBLE_LAPTOP_SVG,
    description: 'PC portable hybride rotatif 360° avec dalle tactile IPS Full HD et SSD ultra-rapide.',
    currency: 'XOF',
    stock: 8,
    isFeatured: true
  },
  {
    id: 'tech-purple-solo2',
    name: 'Purple Solo 2 Wireless On-Ear High-Definition',
    category: 'Headphones',
    price: 89000,
    image: ELECTRO_HEADPHONES_HERO_SVG,
    description: 'Casque sans fil arceau aluminium, isolation passive haute clarté sonore et 40h d’autonomie.',
    currency: 'XOF',
    stock: 15,
    isFeatured: true
  },
  {
    id: 'tech-smartphone-6s',
    name: 'Smartphone 6S 32GB LTE Unlocked Gold Edition',
    category: 'Smartphones & Tablettes',
    price: 135000,
    originalPrice: 160000,
    image: ELECTRO_SMARTPHONE_GOLD_SVG,
    description: 'Écran Retina HD 4.7 pouces, capteur Touch ID réactif et appareil photo 12 MP 4K.',
    currency: 'XOF',
    stock: 14,
    isFeatured: true
  },
  {
    id: 'tech-nx-camera',
    name: 'Widescreen NX Mini F1 SMART NX Mint Green',
    category: 'Cameras & Photo',
    price: 165000,
    image: ELECTRO_NX_CAMERA_SVG,
    description: 'Appareil photo hybride ultra-fin avec écran orientable pour selfies et optique 9mm grand angle.',
    currency: 'XOF',
    stock: 5,
    isFeatured: true
  },
  {
    id: 'tech-laserjet-m452',
    name: 'Full Color LaserJet Pro M452dn Network Duplex',
    category: 'Printers & Office',
    price: 210000,
    originalPrice: 245000,
    image: ELECTRO_PRINTER_SVG,
    description: 'Imprimante laser réseau professionnelle avec impression recto-verso automatique et écran tactile.',
    currency: 'XOF',
    stock: 9,
    isFeatured: true
  }
];

// Produits supplémentaires pour les onglets Catégories & Bestsellers
export const ELECTRO_ADDITIONAL_PRODUCTS: StoreProductItem[] = [
  {
    id: 'tech-usb-drive-64',
    name: 'Pendrive USB 3.0 Flash Drive 64 GB All-Metal',
    category: 'Accessoires & Stockage',
    price: 12500,
    image: ELECTRO_USB_DRIVE_SVG,
    description: 'Clé USB 3.0 métallique rotative incassable avec vitesse de transfert jusqu’à 150 Mo/s.',
    currency: 'XOF',
    stock: 45
  },
  {
    id: 'tech-gear-vr',
    name: 'Gear Virtual Reality Immersive Headset Black',
    category: 'Réalité Virtuelle',
    price: 59000,
    originalPrice: 79000,
    image: ELECTRO_VR_HEADSET_SVG,
    description: 'Casque VR ergonomique avec champ de vision 101° et molette optique ajustable.',
    currency: 'XOF',
    stock: 11
  },
  {
    id: 'tech-smartwatch-duo',
    name: 'Smartwatch 2.0 LTE Wifi Stainless Steel Bezel',
    category: 'Montres & Objets Connectés',
    price: 110000,
    image: ELECTRO_SMARTWATCH_DUO_SVG,
    description: 'Montre connectée étanche avec suivi cardiaque continu, GPS autonome et écran AMOLED Always-On.',
    currency: 'XOF',
    stock: 19
  }
];
