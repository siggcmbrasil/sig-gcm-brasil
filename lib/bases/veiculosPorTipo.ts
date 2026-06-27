export const VEICULOS_POR_TIPO: Record<string, Record<string, string[]>> = {
  Automóvel: {
    Fiat: ["Uno", "Mobi", "Argo", "Cronos", "Palio", "Siena", "Strada", "Toro"],
    Volkswagen: ["Gol", "Voyage", "Polo", "Virtus", "Saveiro", "T-Cross", "Nivus"],
    Chevrolet: ["Onix", "Onix Plus", "Celta", "Classic", "Corsa", "Cruze", "Tracker", "S10"],
    Toyota: ["Corolla", "Corolla Cross", "Etios", "Yaris", "Hilux", "SW4"],
    Honda: ["Civic", "City", "Fit", "HR-V", "WR-V"],
    Hyundai: ["HB20", "HB20S", "Creta", "Tucson", "ix35"],
    Renault: ["Kwid", "Sandero", "Logan", "Duster", "Oroch"],
    Jeep: ["Renegade", "Compass", "Commander"],
    Nissan: ["March", "Versa", "Kicks", "Sentra", "Frontier"],
    Ford: ["Ka", "Fiesta", "Focus", "EcoSport", "Ranger"],
    BYD: ["Dolphin", "Dolphin Mini", "Song Plus", "Yuan Plus", "Seal"],
    GWM: ["Haval H6", "Ora 03", "Tank 300"],
    Outro: ["Outro modelo"],
  },

  Motocicleta: {
    Honda: ["CG 125", "CG 150", "CG 160", "Biz", "Pop 110i", "Bros", "XRE 190", "XRE 300", "CB 300"],
    Yamaha: ["Factor", "Fazer 150", "Fazer 250", "Lander", "XTZ", "NMax", "XMax"],
    Suzuki: ["Yes", "Intruder", "Burgman", "GSX", "V-Strom"],
    Shineray: ["Jet", "Phoenix", "XY 50", "Worker"],
    Dafra: ["Apache", "Citycom", "Next", "Kansas"],
    Kawasaki: ["Ninja", "Z400", "Versys"],
    BMW: ["G 310", "F 850 GS", "R 1250 GS"],
    Outro: ["Outro modelo"],
  },

  Caminhão: {
    MercedesBenz: ["Atego", "Axor", "Actros", "Accelo"],
    Volkswagen: ["Delivery", "Constellation", "Worker"],
    Volvo: ["FH", "FM", "VM"],
    Scania: ["P-Series", "G-Series", "R-Series", "S-Series"],
    Iveco: ["Daily", "Tector", "Stralis", "Hi-Way"],
    Ford: ["Cargo", "F-4000"],
    Outro: ["Outro modelo"],
  },

  Ônibus: {
    MercedesBenz: ["OF", "LO", "O-500"],
    Volkswagen: ["Volksbus"],
    Volvo: ["B270F", "B340M", "B450R"],
    Scania: ["K-Series", "F-Series"],
    Iveco: ["Bus", "Daily Minibus"],
    Outro: ["Outro modelo"],
  },

  Bicicleta: {
    Caloi: ["Explorer", "Elite", "Vulcan", "Ceci"],
    Monark: ["Barra Circular", "BMX", "Mountain Bike"],
    Sense: ["Impact", "One", "Rock"],
    Oggi: ["Hacker", "Big Wheel", "Agile"],
    Specialized: ["Rockhopper", "Stumpjumper"],
    Trek: ["Marlin", "Domane", "Émonda"],
    Houston: ["Foxer", "Atlantis"],
    Outro: ["Outro modelo"],
  },

  Embarcação: {
    Yamaha: ["Jet Ski", "Motor de popa"],
    Mercury: ["Motor de popa"],
    Evinrude: ["Motor de popa"],
    Fibrafort: ["Focker", "Lancha"],
    Ventura: ["Lancha"],
    Outro: ["Outro modelo"],
  },

  Outro: {
    Outro: ["Outro modelo"],
  },
};