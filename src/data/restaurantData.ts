
export interface Plat {
  id?: string;
  nom: string;
  description: string | null;
  prix: number;
  options?: string[];
  note?: string;
}

export interface CategorieMenu {
  categorie: string;
  libelle_fr: string;
  plats: Plat[];
}

export interface RestaurantData {
  restaurant: {
    nom: string;
    nom_alternatif: string;
    accroche: string | null;
    description: string | null;
    cuisine: string[];
    logo_url: string | null;
    services: string[];
  };
  lieux: {
    ville: string;
    quartier: string;
    adresse: string;
    telephone: string;
    whatsapp: string | null;
    horaires: string;
    maps_url: string;
  }[];
  menu: CategorieMenu[];
  galerie: {
    url: string;
    titre: string;
  }[];
}

export const RESTAURANT_DATA: RestaurantData = {
  restaurant: {
    nom: "L'italien Piccola Venezia",
    nom_alternatif: "Piccola Venezia",
    accroche: null,
    description: null,
    cuisine: ["Italienne"],
    logo_url: "/assets/logo_5b391c43.png",
    services: []
  },
  lieux: [
    {
      ville: "Douala",
      quartier: "Bonapriso",
      adresse: "Angle rue Njo Njo et rue Toyota, Bonapriso, Douala",
      telephone: "+237 6 99 93 17 21",
      whatsapp: null,
      horaires: "11:30 - 22:30",
      maps_url: "https://www.google.com/maps/search/?api=1&query=Piccola%20Venezia%20Restaurant,%20Douala"
    }
  ],
  menu: [
    {
      categorie: "Antipasti",
      libelle_fr: "Entrées",
      plats: [
        { nom: "Bruschetta", description: "La simplicité gourmande d'un mélange tomates / basilic sur toast grillé", prix: 6000 },
        { nom: "Salade Mixte", description: "Un festival de fraîcheur avec tomates, olives, salade, feta et thon", prix: 8000 },
        { nom: "Bruschetta Piccola", description: "Toast généreusement recouvert de fromage de chèvre, de jambon de Parme et de miel", prix: 8000 },
        { nom: "Carpaccio de Boeuf", description: "De fines tranches de boeufs crues, relevées de vinaigre balsamique et de tranches de Parmesan", prix: 8000 },
        { nom: "Salade Poulet et Copeaux de Parmesan", description: "Salade de légumes, avec du poulet grillé, accompagnés d'olives, de copeaux de Parmesan et Pesto", prix: 9000 },
        { nom: "Caprese", description: "Le fameux fromage traditionnel de la cuisine italienne, avec ses tomates fraiches et goûteuses", prix: 9500 },
        { nom: "Carpaccio de Poisson", description: "Lamelles de poisson frais avec de l'ananas mariné comme il faut", prix: 9500 },
        { nom: "Polenta et Gamberi / Calamars", description: "Un plat des régions vénitiennes avec des crevettes et du calamar accompagné de polenta", prix: 9500, options: ["Gamberi", "Calamars"] },
        { nom: "Tartare à l'Italienne", description: "Filet de boeuf coupé au couteau avec de bonnes tomates, rehaussées de la fraîcheur du basilic", prix: 10000 },
        { nom: "Pizza Fritta", description: "Spécialité napolitaine à base de pâte à pizza frite, accompagnée de fromage et de légumes. Pour minimum 2 personnes", prix: 10500, note: "Minimum 2 personnes" },
        { nom: "Noix de Saint Jacques Poelées et Pancetta", description: "La mariage réussi entre produits de la mer et charcuterie italienne", prix: 10500 },
        { nom: "Prosciutto di Parma", description: "Le jambon de Parme, dont la saveur, les arômes et la texture typiques sont réputés internationalement. Accompagnement : Gnocchio fritto (pain frit)", prix: 11500 },
        { nom: "Mozarella du Bufala", description: "La Mozzarella du bufflonne est une spécialité fromagère italienne appelée la perle de la cuisine méditerranéenne", prix: 12000 },
        { nom: "Salade Italienne", description: "Mozzarella, salade, tomate, jambon de Parme", prix: 15000 },
        { nom: "Affettato Misto", description: "Un mélange de charcuterie italienne. Servie avec : Gnocchio fritto (pain frit)", prix: 16500 }
      ]
    },
    {
      categorie: "I Classici Italiani",
      libelle_fr: "Pâtes",
      plats: [
        { nom: "Penne Arrabiata", description: "Piment, ail et sauce tomate pour lier délicieusement vos pâtes al dente", prix: 7500 },
        { nom: "Tagliatelle Bolognese", description: "Délicieux plat traditionnel à base de viande hachée de boeuf avec en option : Jambon / Champignon", prix: 7500, options: ["Jambon", "Champignon"] },
        { nom: "Spaghetti Puttanesca", description: "En provenance de l'île d'Ischia, une recette qui ne manque pas de piquant avec anchois, olives noires, tomates, persil et ail", prix: 8000 },
        { nom: "Penne Pesto", description: "Vos pâtes avec un vrai pesto artisanal à base de basilic, d'ail et de fromage", prix: 8000 },
        { nom: "Tortiglioni alla Norma", description: "Recette sicilienne à base de pâtes, de tomates et d'aubergines gorgées de soleil", prix: 8000 },
        { nom: "Gnocchi Maison", description: "Spécialité à base de pomme de terre, servie avec de la sauce bolognaise / 4 fromages / Mariarosa", prix: 8500, options: ["Sauce bolognaise", "4 fromages", "Mariarosa"] },
        { nom: "Spaghetti à la Sicilienne", description: "Une variante pleine de peps de nos spaghetti maison", prix: 8500 },
        { nom: "Linguine Amatriciana", description: "Pâtes avec lardons, tomates, oignons et piment, le tout parsemé de pecorino, fromage italien à base de lait de brebis", prix: 8500 },
        { nom: "Rigatoni Cacio Pepe", description: "Les fameuses pâtes en tubes, agrémentées de fromage de brebis et de poivre", prix: 8500 },
        { nom: "Spaghetti Carbonara", description: "Composition spéciale du chef", prix: 8500 },
        { nom: "Farfalle Boscaiola", description: "Champignons, jambon, crème", prix: 9000 },
        { nom: "Ravioli Ricotta Spinaci", description: "Pâtes farcies de fromage fondant et d'épinards", prix: 9000 },
        { nom: "Lasagne Bolognese / Boscaiola", description: "Plats traditionnel du dimanche à la bolognaise (viande hachée) à la boscaiola avec champignons et jambon", prix: 9500, options: ["Bolognese", "Boscaiola"] },
        { nom: "Ravioli aux Courgettes et Crevettes", description: "Pâtes farcies dans les règles de l'art avec légumes et petits crustacés frais", prix: 9500 },
        { nom: "Tagliatelle au Saumon", description: "Une recette raffinée originellement préparée en Italie pour les repas de fête ou les occasions spéciales", prix: 10500 },
        { nom: "Spaghetti Gambas, Lardon, Crème, Piment", description: "Un mélange terre-mer qui change de l'ordinaire (Création du chef)", prix: 12000 },
        { nom: "Bis di Pasta", description: "Deux variétés de pâtes au choix. Variez les plaisirs !", prix: 12000 },
        { nom: "Tris di Pasta", description: "Trois variétés de pâtes au choix. Pour toujours plus de découverte !", prix: 13500 },
        { nom: "Tris del Giorno", description: "Trois variétés de pâtes du jour. Laissez-vous surprendre !", prix: 17000 }
      ]
    },
    {
      categorie: "Carne",
      libelle_fr: "Viandes",
      plats: [
        { nom: "Ossobuco servi avec Tagliatelle", description: "Du veau braisé comme à Milan, avec ses larges pâtes plates, parfaites pour les sauces mijotées", prix: 9000 },
        { nom: "Emincée de Porc", description: "Releé de sauce à la crème et au cognac", prix: 9000 },
        { nom: "Tagliata Grillé à l'Italienne", description: "Filet de boeuf grillé avec roquettes et vinaigre balsamique", prix: 9500 },
        { nom: "Cotoletta de Porc à la Milanaise", description: "Escalope de porc panée à la milanaise frit à la poêle", prix: 10000 },
        { nom: "Saltinbocca", description: "Escalope de porc déposée délicatement sur de la pancetta et des feuilles de sauge", prix: 10000 },
        { nom: "Escalope de Porc au Limone", description: "Une sauce au citron acidulée pour 'réveiller' votre viande", prix: 10000 },
        { nom: "Tagliata au Poivre du Pays", description: "Filet de boeuf avec sauce au poivre vert, haricot vert au lardon, légumes et bacon", prix: 10500 },
        { nom: "Tagliata de Filet au Gorgonzola", description: "Tranche de filet de boeuf avec les fameux gorgonzolas milanais. Accompagnement : gratin de pomme", prix: 11000 },
        { nom: "Paupiette de Poulet au Jambon de Parme", description: "Une volaille inédite, sur lit de tomates et vinaigre balsamique", prix: 11500 }
      ]
    },
    {
      categorie: "Pesce",
      libelle_fr: "Poissons",
      plats: [
        { nom: "Bar ou Capitaine Grillé", description: null, prix: 9500, options: ["Bar", "Capitaine"] },
        { nom: "Capitaine al Cartoccio", description: "Poisson avec ses petits légumes. Cuit en papillote", prix: 10500 },
        { nom: "Bocconcini de Capitaine con Pancetta", description: "Roulé de poisson à la pancetta", prix: 10500 },
        { nom: "Bar ou Capitaine au Poivre Vert", description: null, prix: 10500, options: ["Bar", "Capitaine"] },
        { nom: "Gambas Sautées à l'Ail", description: "L'alchimie parfaite entre le crustacé et le condiment", prix: 17500 },
        { nom: "Brochettes de Gambas", description: null, prix: 17500 }
      ]
    },
    {
      categorie: "Le Pizze",
      libelle_fr: "Pizzas",
      plats: [
        { nom: "Margherita", description: "Le grand classique ! Avec tomates, mozzarella et origan", prix: 7000 },
        { nom: "Manu", description: "Sur une base de sauce tomate et fromage, la pizza avec tomates fraîches et basilic", prix: 7500 },
        { nom: "Vegetarianna", description: "Pour les amoureux des légumes : tomates fraîches, fromage, complétés de courgettes, d'aubergines et de poivrons", prix: 7500 },
        { nom: "Jambon Cuit", description: "Avec sauce tomate et fromage pour magnifier le jambon", prix: 7500 },
        { nom: "Saporita", description: "Tomates fraîches, fromage, basilic; et pour un max de caractère de la feta et de l'ail", prix: 8000 },
        { nom: "Napolitana", description: "Pour une explosion de goût avec des câpres, ses anchois et ses olives sur fond tomate / fromage", prix: 8000 },
        { nom: "Prosciutto Funghi", description: "Tomate, fromage, jambon et champignons. Simplement bon", prix: 8000 },
        { nom: "Calzone", description: "La pizza 'chausson' garnie de tomate, fromage, champignons, jambon, olives, oeuf et poivrons", prix: 8000 },
        { nom: "Venezia", description: "Faite avec amour à base de tomate, fromage, jambon, champignons, aubergines et poivrons", prix: 8000 },
        { nom: "Regina", description: "La reine, avec tomate, fromage, champignons, olives et son oeuf bien frais", prix: 8000 },
        { nom: "Diavola", description: "Pour ceux qui aiment les saveurs épicées : tomate, fromage, saucisson pimenté", prix: 8000 },
        { nom: "Vesuvio", description: "Une pizza, aussi relevée que le volcan : merguez et chorizo sur tomate, fromage et aubergines", prix: 8500 },
        { nom: "Padrino", description: "Sur base de tomate et fromage, du jambon, des champignons, et une pluie de poivrons et d'artichauts", prix: 8500 },
        { nom: "Cappriciosa", description: "Un doux caprice avec tomate, fromage, jambon, champignons, olives et artichauts", prix: 8500 },
        { nom: "Quattro Formaggi", description: "Pizza avec sauce tomate et crème de fromage, Cantal, Gruyère, Brie et Camembert", prix: 8500 },
        { nom: "Paysanne", description: "Tomate, fromage, lit d'oignon, couvert de saucisson et de feta", prix: 9000 },
        { nom: "Don Elio", description: "Accent marin avec du thon, sur sauce tomate et fromage, de la feta, des olives et un oeuf", prix: 9000 },
        { nom: "Frutti di Mare", description: "Retour de pêche avec une pizza aux moules, calamars et crevettes. Base tomate et fromage", prix: 9000 },
        { nom: "Pizza PV", description: "Une pizza généreuse : tomate, fromage, oignons, jambon, aubergines, courgettes, basilic, coppa, parmesan. Et de la sauce pimentée en prime !", prix: 10500 },
        { nom: "Parma", description: "Tomate, fromage et notre fameux jambon de Parme", prix: 11000 }
      ]
    }
  ],
  galerie: []
};
