// Subject-specific customisation options
// For subjects where schools pick different texts/cases/periods/modules

export const SUBJECT_OPTIONS = {
  "English Literature": {
    label: "Set Texts",
    type: "multi-category",
    categories: [
      { name: "Shakespeare", options: ["Hamlet", "Macbeth", "Othello", "King Lear", "The Tempest", "A Midsummer Night's Dream", "Much Ado About Nothing", "Measure for Measure", "Antony and Cleopatra", "Twelfth Night", "Romeo and Juliet", "The Merchant of Venice"] },
      { name: "Pre-1900 Novels", options: ["Jane Eyre", "Wuthering Heights", "Frankenstein", "Great Expectations", "Hard Times", "Tess of the d'Urbervilles", "The Picture of Dorian Gray", "Dracula", "The Strange Case of Dr Jekyll and Mr Hyde", "Middlemarch", "Pride and Prejudice", "Emma"] },
      { name: "Modern Novels", options: ["The Great Gatsby", "The Handmaid's Tale", "Beloved", "A Thousand Splendid Suns", "Atonement", "The Kite Runner", "Never Let Me Go", "The Remains of the Day", "The Color Purple", "The God of Small Things", "Birdsong"] },
      { name: "Drama", options: ["A Streetcar Named Desire", "Death of a Salesman", "A Doll's House", "The Importance of Being Earnest", "An Inspector Calls", "Top Girls", "A View from the Bridge", "All My Sons", "The Crucible", "Translations", "Waiting for Godot"] },
      { name: "Poetry", options: ["Duffy - Feminine Gospels", "Heaney - Death of a Naturalist", "Owen - War Poems", "Keats - Selected Poems", "Larkin - The Whitsun Weddings", "Plath - Ariel", "Rossetti - Selected Poems", "Donne - Selected Poems", "Hardy - Selected Poems", "Blake - Songs of Innocence and Experience", "T.S. Eliot - Selected Poems"] },
    ]
  },
  "History": {
    label: "Periods & Topics",
    type: "multi-category",
    categories: [
      { name: "British", options: ["Tudors 1485-1603", "Stuart Britain 1603-1702", "Georgian Britain 1714-1837", "Victorian Britain 1837-1901", "Britain 1906-1957", "Britain 1945-2007", "The British Empire"] },
      { name: "European", options: ["French Revolution 1789-1815", "Unification of Germany 1815-1871", "Unification of Italy 1815-1871", "Weimar Germany 1918-1933", "Nazi Germany 1933-1945", "Fascist Italy 1919-1945", "Franco's Spain", "Stalinist Russia"] },
      { name: "Russian/Soviet", options: ["Tsarist Russia 1855-1917", "Russian Revolutions 1917", "Lenin's Russia 1917-1924", "Stalin's USSR 1924-1953", "Khrushchev to Gorbachev 1953-1991"] },
      { name: "American", options: ["American Civil War 1861-1877", "Gilded Age 1870-1900", "Progressive Era", "Great Depression & New Deal", "Civil Rights 1865-1992", "Cold War America", "Vietnam War"] },
      { name: "World", options: ["World War One 1914-1918", "Interwar Period 1918-1939", "World War Two 1939-1945", "Cold War 1945-1991", "Chinese Revolution", "Apartheid South Africa", "Indian Independence", "Arab-Israeli Conflict"] },
    ]
  },
  "Law": {
    label: "Areas of Law",
    type: "multi-select",
    options: [
      "Criminal Law - Fatal Offences", "Criminal Law - Non-Fatal Offences", "Criminal Law - Property Offences", "Criminal Law - Defences",
      "Tort Law - Negligence", "Tort Law - Occupiers Liability", "Tort Law - Nuisance", "Tort Law - Vicarious Liability",
      "Contract Law - Formation", "Contract Law - Terms", "Contract Law - Breach & Remedies", "Contract Law - Consumer Rights",
      "Human Rights Act", "Judicial Review", "Constitutional Law", "Equity & Trusts"
    ]
  },
  "Further Mathematics": {
    label: "Optional Modules",
    type: "multi-select",
    options: [
      "Core Pure (required)",
      "Further Pure 1", "Further Pure 2",
      "Further Statistics 1", "Further Statistics 2",
      "Further Mechanics 1", "Further Mechanics 2",
      "Decision 1", "Decision 2"
    ]
  },
  "Religious Studies": {
    label: "Religion & Topics",
    type: "multi-category",
    categories: [
      { name: "Religion", options: ["Christianity", "Islam", "Judaism", "Hinduism", "Buddhism", "Sikhism"] },
      { name: "Themes", options: ["Philosophy of Religion", "Religion & Ethics", "Development of Religious Thought", "Religion & Society"] },
    ]
  },
  "Music": {
    label: "Performance Areas & Set Works",
    type: "multi-category",
    categories: [
      { name: "Area of Study", options: ["Western Classical Tradition", "Rock & Pop", "Musical Theatre", "Jazz", "Vocal Music", "Instrumental Music", "Music for Media", "Art Music Since 1910"] },
    ]
  },
  "Media Studies": {
    label: "Close Study Products",
    type: "multi-select",
    options: [
      "Advertising - Film Posters", "Advertising - Print Ads", "Advertising - TV Ads",
      "Music Videos", "Newspapers", "Magazines", "Radio", "Video Games",
      "Television Drama", "Film Marketing", "Online Media"
    ]
  },
  "Film Studies": {
    label: "Film Focus",
    type: "multi-select",
    options: [
      "Hollywood 1930-1990", "American Film Since 2005", "British Film Since 1995",
      "Global Filmmaking Perspectives", "Documentary Film", "Silent Cinema", "Experimental Film",
      "Film Movements (New Wave, Neorealism, Expressionism)"
    ]
  },
  "Art & Design": {
    label: "Discipline",
    type: "single-select",
    options: ["Fine Art", "Photography", "Graphic Design", "Textile Design", "Three-Dimensional Design", "Critical & Contextual Studies"]
  },
  "Design & Technology": {
    label: "Design Area",
    type: "single-select",
    options: ["Product Design", "Fashion & Textiles", "Graphics", "Electronics & Systems Control", "Food Science"]
  },
};
