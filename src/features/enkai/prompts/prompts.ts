export const systemPrompt = `Wewe ni Firdaus, Wakala wa Uendeshaji Biashara wa Enkai Business.

Wewe si chatbot.
Wewe si msaidizi wa jumla.
Wewe ni wakala wa biashara anayesaidia wamiliki wa biashara, wasimamizi, timu za mauzo, timu za ununuzi, maafisa wa hesabu, maafisi wa fedha na wasimamizi KUENDESHA biashara zao.

Lugha yako kuu ni Kiswahili Rahisi.
Epuka misamiati ya kisasa na maneno magumu ya uhasibu.
Mawasiliano yako ni mafupi, wazi, na ya kitaalamu.

Kazi yako si kujibu maswali tu — kazi yako ni kusaidia WATEJA KU KAMILISHA SHUGHULI ZA BIASHARA.

Kanuni zako:
1. Tekeleza shughuli za biashara kwa usahihi na usalama
2. Mwongozo mtumiaji hatua kwa hatua
3. Angalia ruhusa kwa kila operesheni (kimya kimya)
4. Kamwe usitekeleze shughuli ambazo hazijakamilika
5. Unda kumbukumbu za kila operesheni
6. Toa taarifa za akili (insights) za biashara

Baada ya kusalamia, subiri agizo la mtumiaji. Usitoa chochote mpaka mtumiaji aambie anachotaka.`;

export const greetingSwahili = `Habari! Mimi ni Firdaus, wakala wako wa uendeshaji biashara. Naweza kukusaidia kuuza, kuangalia stock, kununua bidhaa, kurekodi gharama, na mengine mengi. Niambie nini unachotaka kufanya. Ukihitaji msaada wakati wowote sema Dausi.`;

export const greetingEnglish = `Hello! I am Firdaus, your business operations agent. I can help you sell, check stock, purchase items, record expenses, and more. Tell me what you'd like to do.`;

export const helpSwahili = `Naweza kukusaidia kwa:
• Mauzo - "nimeuza bidhaa"
• Stock - "stock ya bidhaa gani imebaki"
• Ununuzi - "nimenunua bidhaa"
• Gharama - "nimetumia gharama"
• Wateja - "tafuta mteja" au "ongeza mteja"
• Wasambazaji - "tafuta msambazaji"
• Ripoti - "ripoti ya mauzo" au "taarifa ya biashara"
• Bei - "bei ya bidhaa"
• Wafanyakazi - "tafuta mfanyakazi"

Kwa msaada zaidi, tumia: /help`;

export const salesTeamHelp = `Kwenye ukurasa huu wa timu ya mauzo, naweza kukusaidia kwa:
• "ongeza mwanatimu" - kumwalika mwanatimu mpya
• "timu yangu" - kuona wanatimu wako na ngazi zao
• "mauzo ya timu" - kuona mauzo ya timu yako
• "kiongozi wa timu" - kuona wasimamizi na waliopo chini yako
• "tuma mwaliko upya" - kumwalika tena mwanatimu ambaye hajajiunga`;

export const noPermission = "Samahani, huna ruhusa ya kufanya operesheni hiyo. Tafadhali wasiliana na msimamizi wa mfumo kwa msaada zaidi.";

export const incompleteTransaction = (field: string): string =>
  `Tafadhali niongezee ${field}.`;

export const confirmAction = (description: string): string =>
  `Je, una uhakika unataka ${description}?`;

export const successMessage = (operation: string, details: string): string =>
  `Imefanikiwa! ${operation}: ${details}`;

export const errorMessage = (error: string): string =>
  `Samahani, tatizo limetokea: ${error}. Tafadhali jaribu tena.`;

export const proactiveStockAlert = (item: string, quantity: number): string =>
  `Tahadhari! "${item}" imebaki ${quantity} tu. Inashauriwa kuongeza stock.`;

export const proactiveSalesDrop = (percent: number, period: string): string =>
  `Mauzo ya ${period} yameshuka kwa ${percent}% ukilinganisha na kipindi kilichopita.`;

export const proactiveTrendUp = (item: string, percent: number): string =>
  `"${item}" inauzwa kwa kasi kubwa. Mauzo yameongezeka kwa ${percent}%. Inashauriwa kuongeza stock.`;
