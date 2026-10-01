import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import Service from '../models/Service.js';
import User from '../models/User.js';
import Tractor from '../models/Tractor.js';
import Setting from '../models/Setting.js';
import { connectDB, disconnectDB } from '../config/db.js';

export const initialServices = [
  // SECTION 1 — నేల దున్నే పనులు / Soil Ploughing Services (Acre-based)
  {
    code: 'PLOUGH_ENUGU_GORU',
    category: 'SOIL_PLOUGHING',
    categoryNames: {
      te: 'నేల దున్నే పనులు',
      en: 'Soil Ploughing Services',
      hi: 'खेत की जुताई सेवाएं'
    },
    name: {
      te: 'ఎనుగు గోరు (Heavy Plough – Enugu Goru)',
      en: 'Heavy Plough (Enugu Goru)',
      hi: 'एनुगु गोरु (भारी हल - Enugu Goru)'
    },
    unit: 'Acre',
    price: 1350,
    image: '/images/cat_ploughing.jpg',
    icon: 'Tractor',
    displayOrder: 1,
    description: {
      te: 'భారీ నేలలకు మరియు మొదటి సారి దున్నడానికి అత్యంత అనువైన భారీ ఎనుగు గోరు.',
      en: 'Heavy-duty primary soil tillage plough implement for hard soil and deep aeration.',
      hi: 'कठोर और भारी मिट्टी की पहली गहरी जुताई के लिए सर्वोत्तम भारी हल।'
    }
  },
  {
    code: 'PLOUGH_SADHARANA_GORU',
    category: 'SOIL_PLOUGHING',
    categoryNames: {
      te: 'నేల దున్నే పనులు',
      en: 'Soil Ploughing Services',
      hi: 'खेत की जुताई सेवाएं'
    },
    name: {
      te: 'సాధారణ గోరు (Normal Plough – Sadharana Goru)',
      en: 'Normal Plough (Sadharana Goru)',
      hi: 'साधारण गोरु (सामान्य हल - Sadharana Goru)'
    },
    unit: 'Acre',
    price: 1050,
    image: '/images/cat_ploughing.jpg',
    icon: 'Tractor',
    displayOrder: 2,
    description: {
      te: 'సాధారణ దుక్కులకు మరియు నేలను చదునుగా దున్నడానికి ఉత్తమ ఎంపిక.',
      en: 'Standard medium-depth soil ploughing for regular seasonal farm preparation.',
      hi: 'नियमित मौसमी खेती की तैयारी और सामान्य जुताई के लिए आदर्श।'
    }
  },
  {
    code: 'PLOUGH_DISK_GORU',
    category: 'SOIL_PLOUGHING',
    categoryNames: {
      te: 'నేల దున్నే పనులు',
      en: 'Soil Ploughing Services',
      hi: 'खेत की जुताई सेवाएं'
    },
    name: {
      te: 'డిస్క్ గోరు (Disc Plough – Disk Goru)',
      en: 'Disc Plough (Disk Goru)',
      hi: 'डिस्क गोरु (डिस्क हल - Disk Goru)'
    },
    unit: 'Acre',
    price: 1200,
    image: '/images/cat_ploughing.jpg',
    icon: 'Disc',
    displayOrder: 3,
    description: {
      te: 'రాళ్ల నేలల్లో మరియు గట్టి గడ్డి ఉన్న పొలాల్లో సులభంగా దున్నడానికి డిస్క్ గోరు.',
      en: 'High-strength steel disc plough for stony ground, stubborn roots, and thick weeds.',
      hi: 'पथरीली जमीन और घनी घास वाली मिट्टी को काटने के लिए मजबूत डिस्क हल।'
    }
  },
  {
    code: 'PLOUGH_ROUND_GORU',
    category: 'SOIL_PLOUGHING',
    categoryNames: {
      te: 'నేల దున్నే పనులు',
      en: 'Soil Ploughing Services',
      hi: 'खेत की जुताई सेवाएं'
    },
    name: {
      te: 'రౌండ్ గోరు (Round Plough – Round Goru)',
      en: 'Round Plough (Round Goru)',
      hi: 'राउंड गोरु (गोल हल - Round Goru)'
    },
    unit: 'Acre',
    price: 950,
    image: '/images/cat_ploughing.jpg',
    icon: 'RotateCw',
    displayOrder: 4,
    description: {
      te: 'మట్టి పెల్లలను పొడి చేయడానికి మరియు వేగవంతమైన మట్టి గొలపడానికి రౌండ్ గోరు.',
      en: 'Rotary action soil breaker to pulverize clods and create fine seed beds.',
      hi: 'मिट्टी के ढेलों को तोड़ने और बारीक भुरभुरी मिट्टी तैयार करने के लिए।'
    }
  },
  {
    code: 'PLOUGH_CULTIVATOR',
    category: 'SOIL_PLOUGHING',
    categoryNames: {
      te: 'నేల దున్నే పనులు',
      en: 'Soil Ploughing Services',
      hi: 'खेत की जुताई सेवाएं'
    },
    name: {
      te: 'కల్టివేటర్ గోరు (Cultivator – Cultivator Goru)',
      en: 'Cultivator (Cultivator Goru)',
      hi: 'कल्टीवेटर गोरु (कल्टीवेटर - Cultivator Goru)'
    },
    unit: 'Acre',
    price: 850,
    image: '/images/cat_ploughing.jpg',
    icon: 'Grid',
    displayOrder: 5,
    description: {
      te: '9/11 టైన్లతో వేగంగా కలుపు తీత మరియు ఉపరితల దుక్కుల కోసం.',
      en: 'Spring tine cultivator for swift secondary tillage, weed destruction, and soil aerating.',
      hi: 'तेज द्वितीयक जुताई, खरपतवार हटाने और मिट्टी को हवादार बनाने हेतु।'
    }
  },
  {
    code: 'PLOUGH_LOTHU_DUNNE_GORU',
    category: 'SOIL_PLOUGHING',
    categoryNames: {
      te: 'నేల దున్నే పనులు',
      en: 'Soil Ploughing Services',
      hi: 'खेत की जुताई सेवाएं'
    },
    name: {
      te: 'లోతు దున్నే గోరు (Deep Plough – Lothu Dunne Goru)',
      en: 'Deep Plough (Lothu Dunne Goru)',
      hi: 'लोथु दुन्ने गोरु (गहरा हल - Deep Plough)'
    },
    unit: 'Acre',
    price: 1350,
    image: '/images/cat_ploughing.jpg',
    icon: 'ArrowDownCircle',
    displayOrder: 6,
    description: {
      te: 'భూమి లోతు పొరల వరకు దున్ని నేల సారవంతత పెంచే లోతు దున్నే గోరు.',
      en: 'Sub-soil deep penetration plough breaking the hardpan for deep root penetration.',
      hi: 'भूमि की निचली सख्त परत को तोड़कर गहरी नमी संचयन के लिए।'
    }
  },
  {
    code: 'PLOUGH_VARI_BURADHA_GORU',
    category: 'SOIL_PLOUGHING',
    categoryNames: {
      te: 'నేల దున్నే పనులు',
      en: 'Soil Ploughing Services',
      hi: 'खेत की जुताई सेवाएं'
    },
    name: {
      te: 'వరి బురద గోరు (Paddy Puddling – Vari Buradha Goru)',
      en: 'Paddy Puddling (Vari Buradha Goru)',
      hi: 'धान कीचड़ हल (Paddy Puddling - Vari Buradha Goru)'
    },
    unit: 'Acre',
    price: 1200,
    image: '/images/cat_ploughing.jpg',
    icon: 'Waves',
    displayOrder: 7,
    description: {
      te: 'వరి నాటు వేయడానికి అవసరమైన నీటి బురదను సమపాళ్లలో మిశ్రమం చేసే గోరు.',
      en: 'Paddy field puddling implement for wet cultivation and water retention.',
      hi: 'धान की रोपाई के लिए गीले खेत में कीचड़ गाहने और समतल करने के लिए।'
    }
  },
  {
    code: 'PLOUGH_VARI_POLAM_CHADUNU',
    category: 'SOIL_PLOUGHING',
    categoryNames: {
      te: 'నేల దున్నే పనులు',
      en: 'Soil Ploughing Services',
      hi: 'खेत की जुताई सेवाएं'
    },
    name: {
      te: 'వరి పొలం చదును గోరు (Paddy Leveller – Vari Polam Chadunu Goru)',
      en: 'Paddy Leveller (Vari Polam Chadunu Goru)',
      hi: 'धान खेत समतलीकरण हल (Paddy Leveller)'
    },
    unit: 'Acre',
    price: 1000,
    image: '/images/cat_ploughing.jpg',
    icon: 'Maximize2',
    displayOrder: 8,
    description: {
      te: 'వరి పొలంలో నీరు సమానంగా నిల్వ ఉండటానికి కచ్చితమైన చదును చేసే పని.',
      en: 'Field leveling board for uniform water distribution and weed control.',
      hi: 'धान के खेत में समान पानी फैलाव हेतु सटीक समतलीकरण।'
    }
  },
  {
    code: 'PLOUGH_CAGE_WHEEL',
    category: 'SOIL_PLOUGHING',
    categoryNames: {
      te: 'నేల దున్నే పనులు',
      en: 'Soil Ploughing Services',
      hi: 'खेत की जुताई सेवाएं'
    },
    name: {
      te: 'కేజ్ వీల్ (Cage Wheel – Cage Wheel)',
      en: 'Cage Wheel (Cage Wheel)',
      hi: 'केज व्हील (Cage Wheel - कीचड़ पहिया)'
    },
    unit: 'Acre',
    price: 1000,
    image: '/images/cat_ploughing.jpg',
    icon: 'CircleDot',
    displayOrder: 9,
    description: {
      te: 'బురద పొలాల్లో ట్రాక్టర్ చక్రాలు దిగబడకుండా నడిచే ప్రత్యేక కేజ్ వీల్స్.',
      en: 'Steel cage wheels attached to tractor tires to glide without sinking in wetland paddy.',
      hi: 'कीचड़ वाले खेतों में ट्रैक्टर को धंसने से बचाने वाले स्टील केज व्हील।'
    }
  },

  // SECTION 2 — విత్తనాలు వేసే పనులు / Seed Sowing Services (Acre-based)
  {
    code: 'SOW_VITTANALA_GORU',
    category: 'SEED_SOWING',
    categoryNames: {
      te: 'విత్తనాలు వేసే పనులు',
      en: 'Seed Sowing Services',
      hi: 'बीज बुवाई सेवाएं'
    },
    name: {
      te: 'విత్తనాల గోరు (Seed Drill – Vittanala Goru)',
      en: 'Seed Drill (Vittanala Goru)',
      hi: 'बीज ड्रिल हल (Seed Drill - Vittanala Goru)'
    },
    unit: 'Acre',
    price: 1000,
    image: '/images/cat_seeding.jpg',
    icon: 'Sprout',
    displayOrder: 10,
    description: {
      te: 'విత్తనాలు సమాన దూరంలో మరియు కచ్చితమైన లోతులో నాటే ప్రామాణిక విత్తనాల గోరు.',
      en: 'Multi-channel tractor mounted seed drill for uniform spacing and germination.',
      hi: 'समान दूरी और सही गहराई पर बीज बोने के लिए बहु-पंक्ति ड्रिल हल।'
    }
  },
  {
    code: 'SOW_GROUNDNUT_PLANTER_1',
    category: 'SEED_SOWING',
    categoryNames: {
      te: 'విత్తనాలు వేసే పనులు',
      en: 'Seed Sowing Services',
      hi: 'बीज बुवाई सेवाएं'
    },
    name: {
      te: 'వేరుశనగ విత్తే మిషన్ (Groundnut Planter – Verushanaga Vitte Mission)',
      en: 'Groundnut Planter (Verushanaga Vitte Mission)',
      hi: 'मूंगफली बुवाई मशीन (Groundnut Planter)'
    },
    unit: 'Acre',
    price: 1400,
    image: '/images/cat_seeding.jpg',
    icon: 'Layers',
    displayOrder: 11,
    description: {
      te: 'వేరుశనగ కాయలు నలిగిపోకుండా కచ్చితమైన దూరం మరియు ఎరువుతో కలిపి నాటే యంత్రం.',
      en: 'High-precision groundnut planter ensuring uncrushed seeds and paired fertilizer.',
      hi: 'मूंगफली के बीजों को बिना तोड़े सटीक दूरी और खाद के साथ बोने वाली मशीन।'
    }
  },
  {
    code: 'SOW_MAIZE_PLANTER',
    category: 'SEED_SOWING',
    categoryNames: {
      te: 'విత్తనాలు వేసే పనులు',
      en: 'Seed Sowing Services',
      hi: 'बीज बुवाई सेवाएं'
    },
    name: {
      te: 'మొక్కజొన్న విత్తే మిషన్ (Maize Planter – Mokkajonna Vitte Mission)',
      en: 'Maize Planter (Mokkajonna Vitte Mission)',
      hi: 'मक्का बुवाई मशीन (Maize Planter - Mokkajonna Vitte Mission)'
    },
    unit: 'Acre',
    price: 1200,
    image: '/images/cat_seeding.jpg',
    icon: 'CheckCircle',
    displayOrder: 12,
    description: {
      te: 'మొక్కజొన్న గింజలను కచ్చితమైన వరుసల్లో అత్యధిక మొలక శాతంతో నాటే ఆధునిక యంత్రం.',
      en: 'Precision maize planter with calibrated seed disc for optimal plant density.',
      hi: 'मक्के के बीजों को सटीक पंक्तियों और उचित दूरी पर बोने वाली आधुनिक मशीन।'
    }
  },
  {
    code: 'SOW_COTTON_PLANTER',
    category: 'SEED_SOWING',
    categoryNames: {
      te: 'విత్తనాలు వేసే పనులు',
      en: 'Seed Sowing Services',
      hi: 'बीज बुवाई सेवाएं'
    },
    name: {
      te: 'పత్తి విత్తే మిషన్ (Cotton Planter – Patti Vitte Mission)',
      en: 'Cotton Planter (Patti Vitte Mission)',
      hi: 'कपास बुवाई मशीन (Cotton Planter - Patti Vitte Mission)'
    },
    unit: 'Acre',
    price: 1250,
    image: '/images/cat_seeding.jpg',
    icon: 'Sparkles',
    displayOrder: 13,
    description: {
      te: 'పత్తి విత్తనాల కోసం ప్రత్యేక సాళ్లు తీసి విత్తనాలు నాటే యంత్రం.',
      en: 'Dedicated cotton seed planter creating uniform ridge and furrow seedbeds.',
      hi: 'कपास की फसल के लिए समुचित दूरी पर सटीक बीजारोपण मशीन।'
    }
  },
  {
    code: 'SOW_PULSE_PLANTER',
    category: 'SEED_SOWING',
    categoryNames: {
      te: 'విత్తనాలు వేసే పనులు',
      en: 'Seed Sowing Services',
      hi: 'बीज बुवाई सेवाएं'
    },
    name: {
      te: 'పప్పులు విత్తే మిషన్ (Pulse Planter – Pappulu Vitte Mission)',
      en: 'Pulse Planter (Pappulu Vitte Mission)',
      hi: 'दाल बुवाई मशीन (Pulse Planter - Pappulu Vitte Mission)'
    },
    unit: 'Acre',
    price: 1000,
    image: '/images/cat_seeding.jpg',
    icon: 'Feather',
    displayOrder: 14,
    description: {
      te: 'కందులు, పెసలు, మినుములు వంటి పప్పు దినుసులను సమర్థవంతంగా నాటే యంత్రం.',
      en: 'Multi-pulse planter suited for red gram, black gram, green gram, and chickpeas.',
      hi: 'अरहर, मूंग, उड़द और चना आदि दलहनी फसलों की सटीक बुवाई हेतु।'
    }
  },
  {
    code: 'SOW_ROW_SEED_PLANTER',
    category: 'SEED_SOWING',
    categoryNames: {
      te: 'విత్తనాలు వేసే పనులు',
      en: 'Seed Sowing Services',
      hi: 'बीज बुवाई सेवाएं'
    },
    name: {
      te: 'వరుస విత్తనాల మిషన్ (Row Seed Planter – Varusa Vittanala Mission)',
      en: 'Row Seed Planter (Varusa Vittanala Mission)',
      hi: 'पंक्ति बीज बुवाई मशीन (Row Seed Planter)'
    },
    unit: 'Acre',
    price: 1000,
    image: '/images/cat_seeding.jpg',
    icon: 'AlignJustify',
    displayOrder: 15,
    description: {
      te: 'అన్ని రకాల ఆహార పంటలకు సమాంతర వరుసల్లో విత్తనాలు నాటే బహుళ ప్రయోజన యంత్రం.',
      en: 'Universal row crop planter designed for straight lines and easy inter-cultivation.',
      hi: 'सीधी पंक्तियों में बुवाई जिससे निराई-गुड़ाई में अत्यधिक सुविधा मिले।'
    }
  },
  {
    code: 'SOW_GROUNDNUT_SEED_DRILL',
    category: 'SEED_SOWING',
    categoryNames: {
      te: 'విత్తనాలు వేసే పనులు',
      en: 'Seed Sowing Services',
      hi: 'बीज बुवाई सेवाएं'
    },
    name: {
      te: 'వేరుశనగ విత్తే మిషన్ (Groundnut Seed Drill – Verushanaga Vitte Mission)',
      en: 'Groundnut Seed Drill (Verushanaga Vitte Mission)',
      hi: 'मूंगफली सीड ड्रिल (Groundnut Seed Drill)'
    },
    unit: 'Acre',
    price: 1400,
    image: '/images/cat_seeding.jpg',
    icon: 'Disc',
    displayOrder: 16,
    description: {
      te: 'భారీ స్థాయిలో వేరుశనగ విత్తనాలు నాటే డ్రిల్ యంత్రం.',
      en: 'Heavy-duty groundnut seed drill unit for large commercial acreages.',
      hi: 'बड़े रकबे पर तेजी से मूंगफली की बुवाई के लिए भारी सीड ड्रिल।'
    }
  },

  // SECTION 3 — ట్రాలీ / లోడ్ పనులు / Trolley & Load Services (Trip-based)
  {
    code: 'TROLLEY_VARI_LOAD',
    category: 'TROLLEY_LOAD',
    categoryNames: {
      te: 'ట్రాలీ / లోడ్ పనులు',
      en: 'Trolley & Load Services',
      hi: 'ट्रॉली / ढुलाई सेवाएं'
    },
    name: {
      te: 'వరి లోడ్ (Paddy Load – Vari Load)',
      en: 'Paddy Load (Vari Load)',
      hi: 'धान लोड (Paddy Load - Vari Load)'
    },
    unit: 'Trip',
    price: 1000,
    image: '/images/cat_trolley.jpg',
    icon: 'Truck',
    displayOrder: 17,
    description: {
      te: 'కోత కోసిన వరి ధాన్యం బస్తాలను పొలం నుండి మిల్లు లేదా ఇంటికి సురక్షిత రవాణా.',
      en: 'Transport of harvested paddy grain bags from field to mill/godown.',
      hi: 'खेत से मिल या गोदाम तक धान की बोरियों का सुरक्षित परिवहन।'
    }
  },
  {
    code: 'TROLLEY_VERUSHANAGA_LOAD',
    category: 'TROLLEY_LOAD',
    categoryNames: {
      te: 'ట్రాలీ / లోడ్ పనులు',
      en: 'Trolley & Load Services',
      hi: 'ट्रॉली / ढुलाई सेवाएं'
    },
    name: {
      te: 'వేరుశనగ లోడ్ (Groundnut Load – Verushanaga Load)',
      en: 'Groundnut Load (Verushanaga Load)',
      hi: 'मूंगफली लोड (Groundnut Load - Verushanaga Load)'
    },
    unit: 'Trip',
    price: 1000,
    image: '/images/cat_trolley.jpg',
    icon: 'Truck',
    displayOrder: 18,
    description: {
      te: 'వేరుశనగ కాయలు మరియు పిండి బస్తాల వేగవంతమైన ట్రాలీ రవాణా.',
      en: 'Haulage of bagged or loose groundnut harvest and produce.',
      hi: 'मूंगफली की उपज की सुरक्षित एवं त्वरित मंडी ढुलाई।'
    }
  },
  {
    code: 'TROLLEY_MOKKAJONNA_LOAD',
    category: 'TROLLEY_LOAD',
    categoryNames: {
      te: 'ట్రాలీ / లోడ్ పనులు',
      en: 'Trolley & Load Services',
      hi: 'ट्रॉली / ढुलाई सेवाएं'
    },
    name: {
      te: 'మొక్కజొన్న లోడ్ (Maize Load – Mokkajonna Load)',
      en: 'Maize Load (Mokkajonna Load)',
      hi: 'मक्का लोड (Maize Load - Mokkajonna Load)'
    },
    unit: 'Trip',
    price: 1000,
    image: '/images/cat_trolley.jpg',
    icon: 'Truck',
    displayOrder: 19,
    description: {
      te: 'మొక్కజొన్న కంకులు మరియు గింజల బస్తాల రవాణా.',
      en: 'Bulk transport of maize cobs and harvested grain bags.',
      hi: 'मक्का भुट्टा एवं बोरियों की सुरक्षित खेत से परिवहन सेवा।'
    }
  },
  {
    code: 'TROLLEY_PATTI_LOAD',
    category: 'TROLLEY_LOAD',
    categoryNames: {
      te: 'ట్రాలీ / లోడ్ పనులు',
      en: 'Trolley & Load Services',
      hi: 'ट्रॉली / ढुलाई सेवाएं'
    },
    name: {
      te: 'పత్తి లోడ్ (Cotton Load – Patti Load)',
      en: 'Cotton Load (Patti Load)',
      hi: 'कपास लोड (Cotton Load - Patti Load)'
    },
    unit: 'Trip',
    price: 1000,
    image: '/images/cat_trolley.jpg',
    icon: 'Truck',
    displayOrder: 20,
    description: {
      te: 'పత్తి బస్తాలను జిన్నింగ్ మిల్లులు మరియు మార్కెట్‌కు రవాణా చేసే సేవ.',
      en: 'High-volume netted trolley for raw cotton harvest to ginning mills.',
      hi: 'कच्चे कपास की जिनिंग मिलों और मंडियों तक सुरक्षित ढुलाई।'
    }
  },
  {
    code: 'TROLLEY_GADDI_LOAD',
    category: 'TROLLEY_LOAD',
    categoryNames: {
      te: 'ట్రాలీ / లోడ్ పనులు',
      en: 'Trolley & Load Services',
      hi: 'ट्रॉली / ढुलाई सेवाएं'
    },
    name: {
      te: 'గడ్డి లోడ్ (Hay Load – Gaddi Load)',
      en: 'Hay Load (Gaddi Load)',
      hi: 'घास / भूसा लोड (Hay Load - Gaddi Load)'
    },
    unit: 'Trip',
    price: 900,
    image: '/images/cat_trolley.jpg',
    icon: 'Truck',
    displayOrder: 21,
    description: {
      te: 'వరి మరియు పశుగ్రాసం గడ్డి కట్టల రవాణా సేవ.',
      en: 'Paddy straw and livestock fodder hay transport with side-mesh support.',
      hi: 'पशुओं के लिए धान का पुआल एवं भूसा सुरक्षित ढोने के लिए।'
    }
  },
  {
    code: 'TROLLEY_ERUVU_LOAD',
    category: 'TROLLEY_LOAD',
    categoryNames: {
      te: 'ట్రాలీ / లోడ్ పనులు',
      en: 'Trolley & Load Services',
      hi: 'ट्रॉली / ढुलाई सेवाएं'
    },
    name: {
      te: 'ఎరువు లోడ్ (Fertilizer Load – Eruvu Load)',
      en: 'Fertilizer Load (Eruvu Load)',
      hi: 'खाद लोड (Fertilizer Load - Eruvu Load)'
    },
    unit: 'Trip',
    price: 850,
    image: '/images/cat_trolley.jpg',
    icon: 'Truck',
    displayOrder: 22,
    description: {
      te: 'సేంద్రీయ ఎరువు, పశువుల పెంట లేదా యూరియా బస్తాల రవాణా.',
      en: 'Farmyard manure (FYM), organic compost, and chemical fertilizer carting.',
      hi: 'देसी गोबर की खाद, कंपोस्ट या यूरिया बोरियों की खेत ढुलाई।'
    }
  },
  {
    code: 'TROLLEY_VITTANALA_LOAD',
    category: 'TROLLEY_LOAD',
    categoryNames: {
      te: 'ట్రాలీ / లోడ్ పనులు',
      en: 'Trolley & Load Services',
      hi: 'ट्रॉली / ढुलाई सेवाएं'
    },
    name: {
      te: 'విత్తనాల లోడ్ (Seed Load – Vittanala Load)',
      en: 'Seed Load (Vittanala Load)',
      hi: 'बीज लोड (Seed Load - Vittanala Load)'
    },
    unit: 'Trip',
    price: 850,
    image: '/images/cat_trolley.jpg',
    icon: 'Truck',
    displayOrder: 23,
    description: {
      te: 'ప్రభుత్వ గోదాములు లేదా సొసైటీ నుండి పొలానికి విత్తన బస్తాల రవాణా.',
      en: 'Government depot/dealer seed bag transport to village farms.',
      hi: 'सोसायटी या डिपो से खेतों तक प्रमाणित बीज बोरियों की ढुलाई।'
    }
  },
  {
    code: 'TROLLEY_MATTI_LOAD',
    category: 'TROLLEY_LOAD',
    categoryNames: {
      te: 'ట్రాలీ / లోడ్ పనులు',
      en: 'Trolley & Load Services',
      hi: 'ट्रॉली / ढुलाई सेवाएं'
    },
    name: {
      te: 'మట్టి లోడ్ (Soil Load – Matti Load)',
      en: 'Soil Load (Matti Load)',
      hi: 'मिट्टी लोड (Soil Load - Matti Load)'
    },
    unit: 'Trip',
    price: 1150,
    image: '/images/cat_trolley.jpg',
    icon: 'Truck',
    displayOrder: 24,
    description: {
      te: 'పొలం మెరక వేయడానికి చెరువు మట్టి లేదా ఎర్ర మట్టి లోడ్.',
      en: 'Tank silt, fertile topsoil, and red soil transport for farm leveling.',
      hi: 'खेत भराव एवं उपजाऊ तालाब की चिकनी/लाल मिट्टी परिवहन।'
    }
  },
  {
    code: 'TROLLEY_ISUKA_LOAD',
    category: 'TROLLEY_LOAD',
    categoryNames: {
      te: 'ట్రాలీ / లోడ్ పనులు',
      en: 'Trolley & Load Services',
      hi: 'ट्रॉली / ढुలై సేవలు'
    },
    name: {
      te: 'ఇసుక లోడ్ (Sand Load – Isuka Load)',
      en: 'Sand Load (Isuka Load)',
      hi: 'रेत लोड (Sand Load - Isuka Load)'
    },
    unit: 'Trip',
    price: 1250,
    image: '/images/cat_trolley.jpg',
    icon: 'Truck',
    displayOrder: 25,
    description: {
      te: 'పొలం బావులు, డ్రిప్ పనులు మరియు నిర్మాణాలకు ఇసుక లోడ్ రవాణా.',
      en: 'Fine river sand haulage for farm construction and borewell platforms.',
      hi: 'खेत पर निर्माण एवं बोरवेल प्लेटफार्म हेतु नदी रेत ढुलाई।'
    }
  },
  {
    code: 'TROLLEY_RALLA_LOAD',
    category: 'TROLLEY_LOAD',
    categoryNames: {
      te: 'ట్రాలీ / లోడ్ పనులు',
      en: 'Trolley & Load Services',
      hi: 'ट्रॉली / ढुलाई सेवाएं'
    },
    name: {
      te: 'రాళ్ల లోడ్ (Stone Load – Ralla Load)',
      en: 'Stone Load (Ralla Load)',
      hi: 'पत्थर लोड (Stone Load - Ralla Load)'
    },
    unit: 'Trip',
    price: 1250,
    image: '/images/cat_trolley.jpg',
    icon: 'Truck',
    displayOrder: 26,
    description: {
      te: 'పొలం కంచె రాళ్లు, కరకట్టల నిర్మాణం కోసం రాళ్ల లోడ్.',
      en: 'Heavy granite/field stones for farm fencing, bunding, and foundation.',
      hi: 'खेत की बाड़, मेड़बंदी और नींव के लिए भारी पत्थरों की ढुलाई।'
    }
  },
  {
    code: 'TROLLEY_KANKARA_LOAD',
    category: 'TROLLEY_LOAD',
    categoryNames: {
      te: 'ట్రాలీ / లోడ్ పనులు',
      en: 'Trolley & Load Services',
      hi: 'ट्रॉలీ / ढुलाई सेवाएं'
    },
    name: {
      te: 'కంకర లోడ్ (Gravel Load – Kankara Load)',
      en: 'Gravel Load (Kankara Load)',
      hi: 'गिट्टी / कंकड़ लोड (Gravel Load - Kankara Load)'
    },
    unit: 'Trip',
    price: 1250,
    image: '/images/cat_trolley.jpg',
    icon: 'Truck',
    displayOrder: 27,
    description: {
      te: 'పొలం దారులు వేయడానికి మరియు కాంక్రీట్ పనులకు కంకర లోడ్.',
      en: 'Crushed gravel and blue metal for farm road surfacing and concrete work.',
      hi: 'खेत के रास्तों और कंक्रीट कार्यों हेतु मजबूत गिट्टी ढुलाई।'
    }
  },
  {
    code: 'TROLLEY_ITUKALA_LOAD',
    category: 'TROLLEY_LOAD',
    categoryNames: {
      te: 'ట్రాలీ / లోడ్ పనులు',
      en: 'Trolley & Load Services',
      hi: 'ट्रॉలీ / ढुलाई सेवाएं'
    },
    name: {
      te: 'ఇటుకల లోడ్ (Brick Load – Itukala Load)',
      en: 'Brick Load (Itukala Load)',
      hi: 'ईंट लोड (Brick Load - Itukala Load)'
    },
    unit: 'Trip',
    price: 1150,
    image: '/images/cat_trolley.jpg',
    icon: 'Truck',
    displayOrder: 28,
    description: {
      te: 'పశువుల కొట్టాలు మరియు మోటార్ షెడ్ల నిర్మాణానికి ఇటుకల లోడ్.',
      en: 'Red clay / fly ash brick transport for cattle sheds and farm buildings.',
      hi: 'पशु शेड एवं फार्म हाउस निर्माण हेतु ईंटों की सुरक्षित ढुलाई।'
    }
  },
  {
    code: 'TROLLEY_KATTELA_LOAD',
    category: 'TROLLEY_LOAD',
    categoryNames: {
      te: 'ట్రాలీ / లోడ్ పనులు',
      en: 'Trolley & Load Services',
      hi: 'ट्रॉలీ / ढुలై సేవలు'
    },
    name: {
      te: 'కట్టెల లోడ్ (Wood Load – Kattela Load)',
      en: 'Wood Load (Kattela Load)',
      hi: 'लकड़ी लोड (Wood Load - Kattela Load)'
    },
    unit: 'Trip',
    price: 1050,
    image: '/images/cat_trolley.jpg',
    icon: 'Truck',
    displayOrder: 29,
    description: {
      te: 'కలప, కంచె కర్రలు మరియు ఎండిన కట్టెల రవాణా సేవ.',
      en: 'Farm timber, fencing poles, and firewood transport.',
      hi: 'इमारती लकड़ी, बाड़ के खंभों और सूखी लकड़ियों का परिवहन।'
    }
  }
];

export const seedDatabase = async () => {
  try {
    console.log('Seeding initial database data...');

    // 1. Seed or Update Services (Exact 29 services)
    for (const s of initialServices) {
      await Service.findOneAndUpdate(
        { code: s.code },
        { $set: s },
        { upsert: true, new: true }
      );
    }
    console.log(`Seeded ${initialServices.length} exact services.`);

    // 2. Seed Default Admin
    const adminEmail = 'admin@sambatractors.com';
    let admin = await User.findOne({ email: adminEmail });
    if (!admin) {
      admin = new User({
        name: 'Samba Admin',
        email: adminEmail,
        phone: '9848012345',
        password: 'password123',
        role: 'admin',
        language: 'te',
        village: 'Samba Central Hub'
      });
      await admin.save();
      console.log('Created default admin: admin@sambatractors.com / password123');
    }

    // 3. Seed Demo Tractor
    let tractor = await Tractor.findOne({ registrationNumber: 'AP04 AB 1234' });
    if (!tractor) {
      tractor = await Tractor.create({
        name: 'Mahindra Novo 605 DI (60 HP 4WD)',
        registrationNumber: 'AP04 AB 1234',
        hp: 60,
        type: '4WD Heavy Agricultural',
        status: 'available',
        image: '/images/hero_banner.jpg'
      });
      console.log('Created demo tractor AP04 AB 1234');
    }

    // 4. Seed Demo Rider
    const riderEmail = 'rider@sambatractors.com';
    let rider = await User.findOne({ email: riderEmail });
    if (!rider) {
      rider = new User({
        name: 'Ramu (Senior Rider)',
        email: riderEmail,
        phone: '9848054321',
        password: 'password123',
        role: 'rider',
        language: 'te',
        village: 'Peddapuram',
        assignedTractor: tractor._id,
        isAvailable: true
      });
      await rider.save();
      tractor.currentRider = rider._id;
      tractor.status = 'assigned';
      await tractor.save();
      console.log('Created default rider: rider@sambatractors.com / password123');
    }

    // 5. Seed Demo Farmer
    const farmerEmail = 'farmer@sambatractors.com';
    let farmer = await User.findOne({ email: farmerEmail });
    if (!farmer) {
      farmer = new User({
        name: 'Venkat Rao (Farmer)',
        email: farmerEmail,
        phone: '9876543210',
        password: 'password123',
        role: 'farmer',
        language: 'te',
        village: 'Kovvur',
        address: 'Main Road, Kovvur, East Godavari'
      });
      await farmer.save();
      console.log('Created default demo farmer: farmer@sambatractors.com / password123');
    }

    // 6. Seed Payment Settings
    await Setting.findOneAndUpdate(
      { key: 'PAYMENT_SETTINGS' },
      {
        $set: {
          key: 'PAYMENT_SETTINGS',
          value: {
            upiId: 'sambatractors@okaxis',
            accountHolder: 'Samba Tractors Agricultural Services',
            qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=upi://pay?pa=sambatractors@okaxis%26pn=Samba%20Tractors%26cu=INR',
            supportPhone: '+91 98480 12345',
            businessAddress: 'Samba Tractors Hub, Agricultural Market Yard, Kovvur, AP 534350'
          }
        }
      },
      { upsert: true }
    );
    console.log('Payment settings seeded.');
  } catch (err) {
    console.error('Error during database seed:', err);
  }
};

// If run directly:
if (process.argv[1]?.endsWith('seedData.js')) {
  (async () => {
    await connectDB();
    await seedDatabase();
    await disconnectDB();
    process.exit(0);
  })();
}
