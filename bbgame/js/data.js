// Static data banks for name/team generation
const DATA = {
  cities: [
    "Boston","New York","Philadelphia","Chicago","Detroit","Cleveland","Cincinnati","St. Louis","Pittsburgh",
    "Los Angeles","San Francisco","San Diego","Seattle","Portland","Denver","Phoenix","Las Vegas","Dallas",
    "Houston","Austin","Atlanta","Miami","Tampa","Orlando","Charlotte","Nashville","Memphis","New Orleans",
    "Kansas City","Minneapolis","Milwaukee","Indianapolis","Columbus","Buffalo","Baltimore","Washington",
    "Richmond","Raleigh","Birmingham","Salt Lake","Sacramento","Oakland","Anaheim","Honolulu","Albuquerque",
    "Tucson","Omaha","Des Moines","Louisville","Jacksonville","Hartford","Providence","Toronto","Montreal",
    "Vancouver","Calgary","Brooklyn","Queens","Newark","Stockton","Fresno","Tacoma","Rochester","Syracuse"
  ],
  mascots: [
    "Lions","Tigers","Bears","Wolves","Falcons","Eagles","Hawks","Ravens","Cardinals","Bluejays","Owls","Crows",
    "Sharks","Dolphins","Marlins","Stingrays","Whales","Pelicans","Mariners","Pirates","Buccaneers","Privateers",
    "Knights","Kings","Royals","Senators","Generals","Admirals","Captains","Rangers","Outlaws","Renegades",
    "Stars","Comets","Meteors","Rockets","Astros","Galaxies","Pulsars","Suns","Mooncats","Eclipses",
    "Thunder","Storm","Lightning","Hurricanes","Tornados","Blizzards","Cyclones","Tides","Fog","Mist",
    "Miners","Drillers","Smelters","Iron","Steelers","Forgers","Blacksmiths","Lumberjacks","Loggers","Trappers",
    "Coyotes","Foxes","Bobcats","Pumas","Cougars","Mustangs","Broncos","Stallions","Colts","Stampede",
    "Dragons","Phoenix","Griffins","Hydras","Titans","Giants","Spartans","Gladiators","Vikings","Norsemen",
    "Aces","Diamonds","Spades","Wildcards","Jokers","Saints","Angels","Demons","Specters","Reapers",
    "Rhinos","Buffalo","Bison","Moose","Elk","Caribou","Grizzlies","Polars","Walruses","Penguins",
    "Hornets","Wasps","Bees","Mantises","Scorpions","Spiders","Beetles","Locusts","Roaches","Ants",
    "Volcanoes","Quakes","Avalanches","Geysers","Rapids","Currents","Reefs","Crests","Surge","Crashers"
  ],
  affixes: [
    "Royal","Mighty","Iron","Golden","Silver","Crimson","Azure","Emerald","Diamond","Shadow",
    "Thunder","Storm","Frost","Blaze","Wild","Fierce","Lone","Big","Pacific","Atlantic"
  ],
  firstNames: [
    "Jose","Mike","David","Carlos","Juan","Luis","Manny","Alex","Pedro","Roberto","Miguel","Rafael",
    "James","John","Robert","Michael","William","Joseph","Charles","Thomas","Christopher","Daniel","Matthew","Anthony","Mark","Donald","Steven","Andrew","Kenneth","Paul","Joshua","Brandon","Justin","Ryan","Tyler","Jacob","Brian","Kevin","Bryce","Cody","Caleb","Devin","Dustin","Jordan","Logan","Mason","Cameron","Hunter","Aiden","Ethan","Liam","Noah","Owen","Wyatt","Hudson","Levi","Beckett","Roman","Maddox","Jaxon","Dean","Easton","Knox","Bryson","Reid","Holden","Trent","Trevor","Conor","Connor","Quinn","Brody","Diego","Marco","Mateo","Santiago","Sebastián","Andre","Antoine","Marcus","Maurice","Tyrone","DeAndre","DeShawn","Jamal","Jermaine","Kareem","Malik","Trey","Tre","Xavier","Zion","Bo","Buck","Chip","Dak","Hank","Jax","Rocky","Shea","Sully","Tank","Tucker","Wade","Wyatt","Yusei","Hideki","Shohei","Masahiro","Yu","Akira","Kenta","Ichiro","Sadaharu","Park","Lee","Kim","Choi","Won","Jung","Cha","Heo"
  ],
  lastNames: [
    "Rodriguez","Martinez","Gonzalez","Hernandez","Lopez","Garcia","Sanchez","Ramirez","Torres","Rivera","Diaz","Reyes","Cruz","Morales","Ortiz","Gutierrez","Mendoza","Vargas","Castillo","Vega","Soto","Romero","Suarez","Acosta","Delgado","Castro","Aguilar","Pena","Salazar","Guerrero",
    "Smith","Johnson","Williams","Brown","Jones","Miller","Davis","Wilson","Anderson","Taylor","Moore","Jackson","White","Harris","Thompson","Robinson","Clark","Lewis","Walker","Hall","Young","Allen","King","Wright","Hill","Green","Adams","Baker","Nelson","Carter","Mitchell","Roberts","Turner","Phillips","Campbell","Parker","Evans","Edwards","Collins","Stewart","Sanchez","Morris","Rogers","Reed","Cook","Bell","Murphy","Bailey","Cooper","Reynolds","Coleman","Jenkins","Perry","Powell","Long","Patterson","Hughes","Flores","Washington","Butler","Simmons","Foster","Bryant","Alexander","Russell","Griffin","Diaz","Hayes","Myers","Ford","Hamilton","Graham","Sullivan","Wallace","Woods","Cole","West","Jordan","Owens","Burns","Daniels","Palmer","Mills","Nichols","Grant","Knight","Ferguson","Stone","Hawkins","Dunn","Perkins","Hudson","Spencer","Gardner","Stephens","Payne","Pierce","Berry","Matthews","Arnold","Wagner","Willis","Ray","Watkins","Olson","Carroll","Duncan","Snyder","Hart","Cunningham","Bradley","Lane","Andrews","Ruiz","Harper","Fox","Riley","Armstrong","Carpenter","Weaver","Greene","Lawrence","Elliott","Chavez","Sims","Austin","Peters","Kelley","Franklin","Lawson","Fields","Gutierrez","Ryan","Schmidt","Carr","Vasquez","Castillo","Wheeler","Chapman","Oliver","Montgomery","Richards","Williamson","Johnston","Banks","Meyer","Bishop","McCoy","Howell","Alvarez","Morrison","Hansen","Fernandez","Garza","Harvey","Little","Burton","Stanley","Nguyen","George","Jacobs","Reid","Kim","Fuller","Lynch","Dean","Gilbert","Garrett","Romero","Welch","Larson","Frazier","Burke","Hanson","Day","Mendoza","Moreno","Bowman","Medina","Fowler","Brewer","Hoffman","Carlson","Silva","Pearson","Holland","Douglas","Fleming","Jensen","Vargas","Byrd","Davidson","Hopkins","May","Terry","Herrera","Wade","Soto","Walters","Curtis","Neal","Caldwell","Lowe","Jennings","Barnett","Graves","Jimenez","Horton","Shelton","Barrett","Obrien","Castro","Sutton","Gregory","McKinney","Lucas","Miles","Craig","Rodriquez","Chambers","Holt","Lambert","Fletcher","Watts","Bates","Hale","Rhodes","Pena","Beck","Newman","Haynes","McDaniel","Mendez","Bush","Vaughn","Parks","Dawson","Santiago","Norris","Hardy","Love","Steele","Curry","Powers","Schultz","Barker","Guzman","Page","Munoz","Ball","Keller","Chandler","Weber","Leonard","Walsh","Lyons","Ramsey","Wolfe","Schneider","Mullins","Benson","Sharp","Bowen","Daniel","Barber","Cummings","Hines","Baldwin","Griffith","Valdez","Hubbard","Salazar","Reeves","Warner","Stevenson","Burgess","Santos","Tate","Cross","Garner","Mann","Mack","Moss","Thornton","Dennis","McGee","Farmer","Delgado","Aguilar","Vega","Glover","Manning","Cohen","Harmon","Rodgers","Robbins","Newton","Todd","Blair","Higgins","Ingram","Reese","Cannon","Strickland","Townsend","Potter","Goodwin","Walton","Rowe","Hampton","Ortega","Patton","Swanson","Joseph","Francis","Goodman","Maldonado","Yates","Becker","Erickson","Hodges","Rios","Conner","Adkins","Webster","Norman","Malone","Hammond","Flowers","Cobb","Moody","Quinn","Blake","Maxwell","Pope","Floyd","Osborne","Paul","McCarthy","Guerrero","Lindsey","Estrada","Sandoval","Gibbs","Tyler","Gross","Fitzgerald","Stokes","Doyle","Sherman","Saunders","Wise","Colon","Gill","Alvarado","Greer","Padilla","Simon","Waters","Nunez","Ballard","Schwartz","McBride","Houston","Christensen","Klein","Pratt","Briggs","Parsons","McLaughlin","Zimmerman","French","Buchanan","Moran","Copeland","Roy","Pittman","Brady","McCormick","Holloway","Brock","Poole","Frank","Logan","Owen","Bass","Marsh","Drake","Wong","Jefferson","Park","Morton","Abbott","Sparks","Patrick","Norton","Huff","Clayton","Massey","Lloyd","Figueroa","Carson","Bowers","Roberson","Barton","Tran","Lamb","Harrington","Casey","Boone","Cortez","Clarke","Mathis","Singleton","Wilkins","Cain","Bryan","Underwood","Hogan","McKenzie","Collier","Luna","Phelps","McGuire","Allison","Bridges","Wilkerson","Nash","Summers","Atkins"
  ],
  positions: ["C","1B","2B","3B","SS","LF","CF","RF","DH","SP","SP","SP","SP","SP","RP","RP","RP","RP","RP","RP","CP"],
  fieldPositions: ["C","1B","2B","3B","SS","LF","CF","RF"],
  pitcherPositions: ["SP","RP","CP"],
  // 50 years of awards setup
  yearsOfHistory: 50,
  // Player handedness
  hands: ["R","L","R","R","R","L","S"],
  // Personality traits
  traits: [
    "Clubhouse Leader","Hot Head","Cold-Blooded","Streaky","Clutch","Choker","Workhorse","Glass Cannon",
    "Power Hitter","Contact King","Speedster","Slugger","Defensive Wizard","Cannon Arm","Iron Man","Injury Prone",
    "Vocal","Quiet Pro","Showboat","Gentleman","Veteran Presence","Rising Star","Late Bloomer","Bust Risk",
    "Fan Favorite","Media Magnet","Two-Way Threat","Pinch Hit Specialist","Closer Mentality","Strikeout Artist"
  ],
  injuries: [
    {name: "Hamstring Strain", days: [7,21]},
    {name: "Sprained Ankle", days: [10,30]},
    {name: "Sore Shoulder", days: [10,45]},
    {name: "Tommy John Surgery", days: [365,540]},
    {name: "Concussion", days: [7,30]},
    {name: "Oblique Strain", days: [15,40]},
    {name: "Broken Hand", days: [30,60]},
    {name: "Knee Inflammation", days: [10,28]},
    {name: "Back Spasm", days: [5,15]},
    {name: "Wrist Tendonitis", days: [10,25]},
    {name: "Hip Flexor", days: [10,21]},
    {name: "Rotator Cuff Tear", days: [90,180]},
    {name: "Calf Strain", days: [10,20]},
    {name: "Elbow Soreness", days: [7,30]},
    {name: "Forearm Tightness", days: [10,25]}
  ],
  // Color palettes for team identity
  colorSets: [
    ["#1d3557","#e63946"], ["#0a3d62","#fbc531"], ["#2d3436","#fdcb6e"], ["#6c5ce7","#fff200"],
    ["#0c2461","#e58e26"], ["#1e272e","#c0392b"], ["#2c3e50","#16a085"], ["#192a56","#f9ca24"],
    ["#10ac84","#222f3e"], ["#341f97","#f368e0"], ["#576574","#feca57"], ["#222","#ff6b6b"],
    ["#003049","#d62828"], ["#1b4332","#ffd60a"], ["#5a189a","#ffba08"], ["#7f0000","#fff"],
    ["#000814","#ffd60a"], ["#003566","#ffc300"], ["#06092a","#ff006e"], ["#093824","#ff6700"],
    ["#0b132b","#5bc0be"], ["#22223b","#f2e9e4"], ["#283618","#fefae0"], ["#0d1b2a","#778da9"],
    ["#1a1423","#a91d3a"], ["#072227","#35858b"], ["#1e1e24","#ffc145"], ["#0b132b","#3a506b"],
    ["#100d25","#e84855"], ["#04030f","#ff5d8f"], ["#212529","#fca311"], ["#1a1a2e","#16f4d0"]
  ],
  logoSymbols: ["star","diamond","bat","ball","letter","crown","shield","flame","bolt","claw","wing","wave","mountain","sun","moon","skull","anchor","feather","compass","gem"],
};
