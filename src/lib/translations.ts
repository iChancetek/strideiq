// StrideIQ — Internationalization / Translations
// Supported languages: English, Spanish, French, Mandarin, Arabic

export type Language = "en" | "es" | "fr" | "zh" | "ar";

export const LANGUAGE_OPTIONS: { id: Language; label: string; nativeLabel: string; flag: string }[] = [
    { id: "en", label: "English", nativeLabel: "English", flag: "🇺🇸" },
    { id: "es", label: "Spanish", nativeLabel: "Español", flag: "🇪🇸" },
    { id: "fr", label: "French", nativeLabel: "Français", flag: "🇫🇷" },
    { id: "zh", label: "Mandarin", nativeLabel: "中文", flag: "🇨🇳" },
    { id: "ar", label: "Arabic", nativeLabel: "العربية", flag: "🇸🇦" },
];

type TranslationKeys = {
    // Navigation / Sidebar
    dashboard: string;
    activities: string;
    startRun: string;
    achievements: string;
    guide: string;
    aiCoach: string;
    settings: string;
    logOut: string;

    // Dashboard
    welcomeBack: string;
    todayStats: string;
    weeklyGoal: string;
    dailyAffirmation: string;
    recentActivities: string;

    // Activity types
    run: string;
    walk: string;
    bike: string;
    hike: string;
    ride: string;

    // Session Tracker
    startActivity: string;
    stop: string;
    saving: string;
    paused: string;
    distance: string;
    time: string;
    pace: string;
    speed: string;
    steps: string;
    calories: string;
    mileSplits: string;
    sessionComplete: string;
    tooShort: string;

    // Post Session Modal
    nameYourActivity: string;
    howDidItFeel: string;
    addPhotosVideos: string;
    shareToFeed: string;
    visibleToAll: string;
    onlyYou: string;
    saveActivity: string;
    discard: string;

    // Activity Feed
    activityFeed: string;
    newActivity: string;
    thisWeek: string;
    noActivitiesYet: string;
    startFirst: string;
    kudos: string;
    comment: string;
    reply: string;
    deleteComment: string;
    writeComment: string;
    replyTo: string;
    noComments: string;
    justNow: string;
    yesterday: string;
    daysAgo: string;
    hoursAgo: string;
    minutesAgo: string;

    // Settings
    profile: string;
    displayName: string;
    email: string;
    changePhoto: string;
    sessionPreferences: string;
    activityMode: string;
    environment: string;
    outdoor: string;
    indoor: string;
    voiceCoaching: string;
    voiceCoachingDesc: string;
    testVoice: string;
    weatherAnnouncements: string;
    weatherDesc: string;
    showMap: string;
    showMapDesc: string;
    autoPause: string;
    autoPauseDesc: string;
    autoPauseSensitivity: string;
    low: string;
    medium: string;
    high: string;
    preferences: string;
    themeMode: string;
    lightMode: string;
    darkMode: string;
    units: string;
    imperial: string;
    metric: string;
    language: string;
    languageDesc: string;
    support: string;
    installApp: string;

    // Achievements
    achievementsTitle: string;
    unlocked: string;
    locked: string;

    // Guide
    guideTitle: string;
    gettingStarted: string;

    // AI Coach
    aiCoachTitle: string;
    askCoach: string;
    send: string;

    // General
    loading: string;
    error: string;
    save: string;
    cancel: string;
    back: string;
    delete: string;
    edit: string;
    share: string;
    trackPaceDistance: string;
    countStepsRelax: string;
    speedElevation: string;
    trailElevation: string;
};

const translations: Record<Language, TranslationKeys> = {
    en: {
        dashboard: "Dashboard",
        activities: "Activities",
        startRun: "Start Run",
        achievements: "Achievements",
        guide: "Guide",
        aiCoach: "AI Coach",
        settings: "Settings",
        logOut: "Log Out",
        welcomeBack: "Welcome Back",
        todayStats: "Today's Stats",
        weeklyGoal: "Weekly Goal",
        dailyAffirmation: "Daily Affirmation",
        recentActivities: "Recent Activities",
        run: "Run",
        walk: "Walk",
        bike: "Bike",
        hike: "Hike",
        ride: "Ride",
        startActivity: "Start",
        stop: "Stop",
        saving: "Saving...",
        paused: "Paused",
        distance: "Distance",
        time: "Time",
        pace: "Pace",
        speed: "Speed",
        steps: "Steps",
        calories: "Calories",
        mileSplits: "Mile Splits",
        sessionComplete: "Session Complete",
        tooShort: "Session too short to save.",
        nameYourActivity: "Name your activity...",
        howDidItFeel: "How did it feel? Add a description...",
        addPhotosVideos: "Add Photos / Videos",
        shareToFeed: "Share to Feed",
        visibleToAll: "Visible to all users",
        onlyYou: "Only you can see this",
        saveActivity: "Save Activity",
        discard: "Discard",
        activityFeed: "Activity Feed",
        newActivity: "+ New Activity",
        thisWeek: "This Week",
        noActivitiesYet: "No activities yet",
        startFirst: "Start your first activity and it'll appear here!",
        kudos: "Kudos",
        comment: "Comment",
        reply: "Reply",
        deleteComment: "Delete",
        writeComment: "Write a comment...",
        replyTo: "Replying to",
        noComments: "No comments yet. Be the first!",
        justNow: "Just now",
        yesterday: "Yesterday",
        daysAgo: "d ago",
        hoursAgo: "h ago",
        minutesAgo: "m ago",
        profile: "Profile",
        displayName: "Display Name",
        email: "Email",
        changePhoto: "Change Photo",
        sessionPreferences: "Session Preferences",
        activityMode: "Activity Mode",
        environment: "Environment",
        outdoor: "Outdoor",
        indoor: "Indoor",
        voiceCoaching: "Voice Coaching",
        voiceCoachingDesc: "AI announcements at mile splits",
        testVoice: "Test Voice Volume",
        weatherAnnouncements: "Weather Announcements",
        weatherDesc: "Weather update at session start",
        showMap: "Show Map",
        showMapDesc: "Display live map during session",
        autoPause: "Auto-Pause",
        autoPauseDesc: "Automatically pause when stopped",
        autoPauseSensitivity: "Auto-Pause Sensitivity",
        low: "Low",
        medium: "Medium",
        high: "High",
        preferences: "Preferences",
        themeMode: "Theme Mode",
        lightMode: "Light Mode",
        darkMode: "Dark Mode",
        units: "Units",
        imperial: "Imperial (mi)",
        metric: "Metric (km)",
        language: "Language",
        languageDesc: "Change the display language",
        support: "Support",
        installApp: "Install App (PWA)",
        achievementsTitle: "Achievements",
        unlocked: "Unlocked",
        locked: "Locked",
        guideTitle: "Guide",
        gettingStarted: "Getting Started",
        aiCoachTitle: "AI Coach",
        askCoach: "Ask your coach...",
        send: "Send",
        loading: "Loading...",
        error: "Error",
        save: "Save",
        cancel: "Cancel",
        back: "Back",
        delete: "Delete",
        edit: "Edit",
        share: "Share",
        trackPaceDistance: "Track pace & distance",
        countStepsRelax: "Count steps & relax",
        speedElevation: "Speed & elevation",
        trailElevation: "Trail & elevation",
    },
    es: {
        dashboard: "Tablero",
        activities: "Actividades",
        startRun: "Comenzar Carrera",
        achievements: "Logros",
        guide: "Guía",
        aiCoach: "Entrenador IA",
        settings: "Configuración",
        logOut: "Cerrar Sesión",
        welcomeBack: "Bienvenido de Vuelta",
        todayStats: "Estadísticas de Hoy",
        weeklyGoal: "Meta Semanal",
        dailyAffirmation: "Afirmación Diaria",
        recentActivities: "Actividades Recientes",
        run: "Carrera",
        walk: "Caminata",
        bike: "Bicicleta",
        hike: "Senderismo",
        ride: "Paseo",
        startActivity: "Iniciar",
        stop: "Parar",
        saving: "Guardando...",
        paused: "En Pausa",
        distance: "Distancia",
        time: "Tiempo",
        pace: "Ritmo",
        speed: "Velocidad",
        steps: "Pasos",
        calories: "Calorías",
        mileSplits: "Parciales por Milla",
        sessionComplete: "Sesión Completa",
        tooShort: "Sesión muy corta para guardar.",
        nameYourActivity: "Nombra tu actividad...",
        howDidItFeel: "¿Cómo te sentiste? Agrega una descripción...",
        addPhotosVideos: "Agregar Fotos / Videos",
        shareToFeed: "Compartir en el Feed",
        visibleToAll: "Visible para todos",
        onlyYou: "Solo tú puedes ver esto",
        saveActivity: "Guardar Actividad",
        discard: "Descartar",
        activityFeed: "Feed de Actividades",
        newActivity: "+ Nueva Actividad",
        thisWeek: "Esta Semana",
        noActivitiesYet: "Sin actividades aún",
        startFirst: "¡Comienza tu primera actividad y aparecerá aquí!",
        kudos: "Me Gusta",
        comment: "Comentar",
        reply: "Responder",
        deleteComment: "Eliminar",
        writeComment: "Escribe un comentario...",
        replyTo: "Respondiendo a",
        noComments: "Aún no hay comentarios. ¡Sé el primero!",
        justNow: "Justo ahora",
        yesterday: "Ayer",
        daysAgo: "d atrás",
        hoursAgo: "h atrás",
        minutesAgo: "m atrás",
        profile: "Perfil",
        displayName: "Nombre para Mostrar",
        email: "Correo",
        changePhoto: "Cambiar Foto",
        sessionPreferences: "Preferencias de Sesión",
        activityMode: "Modo de Actividad",
        environment: "Entorno",
        outdoor: "Exterior",
        indoor: "Interior",
        voiceCoaching: "Entrenamiento por Voz",
        voiceCoachingDesc: "Anuncios de IA en los parciales",
        testVoice: "Probar Volumen de Voz",
        weatherAnnouncements: "Anuncios del Clima",
        weatherDesc: "Actualización del clima al inicio",
        showMap: "Mostrar Mapa",
        showMapDesc: "Mostrar mapa en vivo durante la sesión",
        autoPause: "Pausa Automática",
        autoPauseDesc: "Pausar automáticamente al detenerse",
        autoPauseSensitivity: "Sensibilidad de Pausa Automática",
        low: "Baja",
        medium: "Media",
        high: "Alta",
        preferences: "Preferencias",
        themeMode: "Modo de Tema",
        lightMode: "Modo Claro",
        darkMode: "Modo Oscuro",
        units: "Unidades",
        imperial: "Imperial (mi)",
        metric: "Métrico (km)",
        language: "Idioma",
        languageDesc: "Cambiar el idioma de la interfaz",
        support: "Soporte",
        installApp: "Instalar App (PWA)",
        achievementsTitle: "Logros",
        unlocked: "Desbloqueado",
        locked: "Bloqueado",
        guideTitle: "Guía",
        gettingStarted: "Primeros Pasos",
        aiCoachTitle: "Entrenador IA",
        askCoach: "Pregunta a tu entrenador...",
        send: "Enviar",
        loading: "Cargando...",
        error: "Error",
        save: "Guardar",
        cancel: "Cancelar",
        back: "Volver",
        delete: "Eliminar",
        edit: "Editar",
        share: "Compartir",
        trackPaceDistance: "Registra ritmo y distancia",
        countStepsRelax: "Cuenta pasos y relájate",
        speedElevation: "Velocidad y elevación",
        trailElevation: "Sendero y elevación",
    },
    fr: {
        dashboard: "Tableau de Bord",
        activities: "Activités",
        startRun: "Commencer Course",
        achievements: "Réalisations",
        guide: "Guide",
        aiCoach: "Coach IA",
        settings: "Paramètres",
        logOut: "Déconnexion",
        welcomeBack: "Bon Retour",
        todayStats: "Stats du Jour",
        weeklyGoal: "Objectif Hebdomadaire",
        dailyAffirmation: "Affirmation Quotidienne",
        recentActivities: "Activités Récentes",
        run: "Course",
        walk: "Marche",
        bike: "Vélo",
        hike: "Randonnée",
        ride: "Balade",
        startActivity: "Démarrer",
        stop: "Arrêter",
        saving: "Enregistrement...",
        paused: "En Pause",
        distance: "Distance",
        time: "Temps",
        pace: "Allure",
        speed: "Vitesse",
        steps: "Pas",
        calories: "Calories",
        mileSplits: "Temps par Mile",
        sessionComplete: "Session Terminée",
        tooShort: "Session trop courte pour être enregistrée.",
        nameYourActivity: "Nommez votre activité...",
        howDidItFeel: "Comment c'était ? Ajoutez une description...",
        addPhotosVideos: "Ajouter Photos / Vidéos",
        shareToFeed: "Partager dans le Fil",
        visibleToAll: "Visible par tous",
        onlyYou: "Vous seul pouvez voir ceci",
        saveActivity: "Enregistrer l'Activité",
        discard: "Abandonner",
        activityFeed: "Fil d'Activités",
        newActivity: "+ Nouvelle Activité",
        thisWeek: "Cette Semaine",
        noActivitiesYet: "Aucune activité pour le moment",
        startFirst: "Commencez votre première activité et elle apparaîtra ici !",
        kudos: "Bravo",
        comment: "Commenter",
        reply: "Répondre",
        deleteComment: "Supprimer",
        writeComment: "Écrire un commentaire...",
        replyTo: "Réponse à",
        noComments: "Aucun commentaire. Soyez le premier !",
        justNow: "À l'instant",
        yesterday: "Hier",
        daysAgo: "j passés",
        hoursAgo: "h passées",
        minutesAgo: "m passées",
        profile: "Profil",
        displayName: "Nom d'Affichage",
        email: "E-mail",
        changePhoto: "Changer la Photo",
        sessionPreferences: "Préférences de Session",
        activityMode: "Mode d'Activité",
        environment: "Environnement",
        outdoor: "Extérieur",
        indoor: "Intérieur",
        voiceCoaching: "Coaching Vocal",
        voiceCoachingDesc: "Annonces IA aux parcours",
        testVoice: "Tester le Volume Vocal",
        weatherAnnouncements: "Annonces Météo",
        weatherDesc: "Mise à jour météo au démarrage",
        showMap: "Afficher la Carte",
        showMapDesc: "Afficher la carte en direct pendant la session",
        autoPause: "Pause Automatique",
        autoPauseDesc: "Mettre en pause automatiquement à l'arrêt",
        autoPauseSensitivity: "Sensibilité de la Pause Auto",
        low: "Faible",
        medium: "Moyenne",
        high: "Élevée",
        preferences: "Préférences",
        themeMode: "Mode de Thème",
        lightMode: "Mode Clair",
        darkMode: "Mode Sombre",
        units: "Unités",
        imperial: "Impérial (mi)",
        metric: "Métrique (km)",
        language: "Langue",
        languageDesc: "Changer la langue d'affichage",
        support: "Support",
        installApp: "Installer l'App (PWA)",
        achievementsTitle: "Réalisations",
        unlocked: "Débloqué",
        locked: "Verrouillé",
        guideTitle: "Guide",
        gettingStarted: "Pour Commencer",
        aiCoachTitle: "Coach IA",
        askCoach: "Demandez à votre coach...",
        send: "Envoyer",
        loading: "Chargement...",
        error: "Erreur",
        save: "Enregistrer",
        cancel: "Annuler",
        back: "Retour",
        delete: "Supprimer",
        edit: "Modifier",
        share: "Partager",
        trackPaceDistance: "Suivre l'allure et la distance",
        countStepsRelax: "Compter les pas et se détendre",
        speedElevation: "Vitesse et élévation",
        trailElevation: "Sentier et élévation",
    },
    zh: {
        dashboard: "仪表板",
        activities: "活动",
        startRun: "开始跑步",
        achievements: "成就",
        guide: "指南",
        aiCoach: "AI教练",
        settings: "设置",
        logOut: "退出",
        welcomeBack: "欢迎回来",
        todayStats: "今日统计",
        weeklyGoal: "周目标",
        dailyAffirmation: "每日鼓励",
        recentActivities: "最近活动",
        run: "跑步",
        walk: "步行",
        bike: "骑行",
        hike: "徒步",
        ride: "骑行",
        startActivity: "开始",
        stop: "停止",
        saving: "保存中...",
        paused: "已暂停",
        distance: "距离",
        time: "时间",
        pace: "配速",
        speed: "速度",
        steps: "步数",
        calories: "卡路里",
        mileSplits: "每英里配速",
        sessionComplete: "运动完成",
        tooShort: "运动时间太短，无法保存。",
        nameYourActivity: "给活动命名...",
        howDidItFeel: "感觉如何？添加描述...",
        addPhotosVideos: "添加照片/视频",
        shareToFeed: "分享到动态",
        visibleToAll: "所有用户可见",
        onlyYou: "仅自己可见",
        saveActivity: "保存活动",
        discard: "放弃",
        activityFeed: "活动动态",
        newActivity: "+ 新活动",
        thisWeek: "本周",
        noActivitiesYet: "暂无活动",
        startFirst: "开始你的第一次活动，它将显示在这里！",
        kudos: "点赞",
        comment: "评论",
        reply: "回复",
        deleteComment: "删除",
        writeComment: "写评论...",
        replyTo: "回复",
        noComments: "暂无评论。做第一个！",
        justNow: "刚刚",
        yesterday: "昨天",
        daysAgo: "天前",
        hoursAgo: "小时前",
        minutesAgo: "分钟前",
        profile: "个人资料",
        displayName: "显示名称",
        email: "邮箱",
        changePhoto: "更换照片",
        sessionPreferences: "运动偏好",
        activityMode: "活动模式",
        environment: "环境",
        outdoor: "户外",
        indoor: "室内",
        voiceCoaching: "语音指导",
        voiceCoachingDesc: "每英里AI语音播报",
        testVoice: "测试语音音量",
        weatherAnnouncements: "天气播报",
        weatherDesc: "开始时天气更新",
        showMap: "显示地图",
        showMapDesc: "运动中实时显示地图",
        autoPause: "自动暂停",
        autoPauseDesc: "停下时自动暂停",
        autoPauseSensitivity: "自动暂停灵敏度",
        low: "低",
        medium: "中",
        high: "高",
        preferences: "偏好设置",
        themeMode: "主题模式",
        lightMode: "浅色模式",
        darkMode: "深色模式",
        units: "单位",
        imperial: "英制 (英里)",
        metric: "公制 (公里)",
        language: "语言",
        languageDesc: "切换显示语言",
        support: "支持",
        installApp: "安装应用 (PWA)",
        achievementsTitle: "成就",
        unlocked: "已解锁",
        locked: "未解锁",
        guideTitle: "指南",
        gettingStarted: "入门指南",
        aiCoachTitle: "AI教练",
        askCoach: "问你的教练...",
        send: "发送",
        loading: "加载中...",
        error: "错误",
        save: "保存",
        cancel: "取消",
        back: "返回",
        delete: "删除",
        edit: "编辑",
        share: "分享",
        trackPaceDistance: "记录配速和距离",
        countStepsRelax: "数步数放松",
        speedElevation: "速度和海拔",
        trailElevation: "步道和海拔",
    },
    ar: {
        dashboard: "لوحة القيادة",
        activities: "الأنشطة",
        startRun: "بدء الجري",
        achievements: "الإنجازات",
        guide: "الدليل",
        aiCoach: "المدرب الذكي",
        settings: "الإعدادات",
        logOut: "تسجيل الخروج",
        welcomeBack: "مرحبًا بعودتك",
        todayStats: "إحصائيات اليوم",
        weeklyGoal: "الهدف الأسبوعي",
        dailyAffirmation: "التأكيد اليومي",
        recentActivities: "الأنشطة الأخيرة",
        run: "جري",
        walk: "مشي",
        bike: "دراجة",
        hike: "تسلق",
        ride: "ركوب",
        startActivity: "ابدأ",
        stop: "توقف",
        saving: "جاري الحفظ...",
        paused: "متوقف مؤقتًا",
        distance: "المسافة",
        time: "الوقت",
        pace: "السرعة",
        speed: "السرعة",
        steps: "الخطوات",
        calories: "السعرات",
        mileSplits: "أقسام الميل",
        sessionComplete: "اكتملت الجلسة",
        tooShort: "الجلسة قصيرة جدًا للحفظ.",
        nameYourActivity: "سم نشاطك...",
        howDidItFeel: "كيف كان شعورك؟ أضف وصفًا...",
        addPhotosVideos: "إضافة صور / فيديو",
        shareToFeed: "مشاركة في الصفحة",
        visibleToAll: "مرئي للجميع",
        onlyYou: "أنت فقط يمكنك رؤية هذا",
        saveActivity: "حفظ النشاط",
        discard: "تجاهل",
        activityFeed: "صفحة الأنشطة",
        newActivity: "+ نشاط جديد",
        thisWeek: "هذا الأسبوع",
        noActivitiesYet: "لا توجد أنشطة بعد",
        startFirst: "ابدأ نشاطك الأول وسيظهر هنا!",
        kudos: "إعجاب",
        comment: "تعليق",
        reply: "رد",
        deleteComment: "حذف",
        writeComment: "اكتب تعليقًا...",
        replyTo: "الرد على",
        noComments: "لا توجد تعليقات بعد. كن الأول!",
        justNow: "الآن",
        yesterday: "أمس",
        daysAgo: "أيام مضت",
        hoursAgo: "ساعات مضت",
        minutesAgo: "دقائق مضت",
        profile: "الملف الشخصي",
        displayName: "اسم العرض",
        email: "البريد الإلكتروني",
        changePhoto: "تغيير الصورة",
        sessionPreferences: "تفضيلات الجلسة",
        activityMode: "نوع النشاط",
        environment: "البيئة",
        outdoor: "خارجي",
        indoor: "داخلي",
        voiceCoaching: "التدريب الصوتي",
        voiceCoachingDesc: "إعلانات صوتية عند كل ميل",
        testVoice: "اختبار مستوى الصوت",
        weatherAnnouncements: "إعلانات الطقس",
        weatherDesc: "تحديث الطقس عند البداية",
        showMap: "إظهار الخريطة",
        showMapDesc: "عرض الخريطة أثناء التمرين",
        autoPause: "إيقاف تلقائي",
        autoPauseDesc: "إيقاف تلقائي عند التوقف",
        autoPauseSensitivity: "حساسية الإيقاف التلقائي",
        low: "منخفض",
        medium: "متوسط",
        high: "عالي",
        preferences: "التفضيلات",
        themeMode: "وضع السمة",
        lightMode: "الوضع الفاتح",
        darkMode: "الوضع الداكن",
        units: "الوحدات",
        imperial: "إمبراطوري (ميل)",
        metric: "متري (كم)",
        language: "اللغة",
        languageDesc: "تغيير لغة العرض",
        support: "الدعم",
        installApp: "تثبيت التطبيق (PWA)",
        achievementsTitle: "الإنجازات",
        unlocked: "مفتوح",
        locked: "مقفل",
        guideTitle: "الدليل",
        gettingStarted: "البدء",
        aiCoachTitle: "المدرب الذكي",
        askCoach: "اسأل مدربك...",
        send: "إرسال",
        loading: "جاري التحميل...",
        error: "خطأ",
        save: "حفظ",
        cancel: "إلغاء",
        back: "رجوع",
        delete: "حذف",
        edit: "تعديل",
        share: "مشاركة",
        trackPaceDistance: "تتبع السرعة والمسافة",
        countStepsRelax: "عد الخطوات واسترخ",
        speedElevation: "السرعة والارتفاع",
        trailElevation: "المسار والارتفاع",
    },
};

export function t(lang: Language, key: keyof TranslationKeys): string {
    return translations[lang]?.[key] || translations.en[key] || key;
}

export function isRTL(lang: Language): boolean {
    return lang === "ar";
}

export default translations;
