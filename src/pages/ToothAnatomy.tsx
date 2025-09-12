import React, { useState, useRef, useEffect } from 'react';
import { RotateCcw, ZoomIn, ZoomOut, Info, X, Eye, MousePointer, Camera, BookOpen, Microscope } from 'lucide-react';
import enamelfStructure from '@/assets/tooth-anatomy/enamel-structure.jpg';
import dentinStructure from '@/assets/tooth-anatomy/dentin-structure.jpg';
import pulpChamber from '@/assets/tooth-anatomy/pulp-chamber.jpg';
import toothRoots from '@/assets/tooth-anatomy/tooth-roots.jpg';

const RealisticToothAnatomy = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedPart, setSelectedPart] = useState<string | null>(null);
  const [rotation, setRotation] = useState({ x: -10, y: 15 });
  const [isDragging, setIsDragging] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1.2);
  const [visibleParts, setVisibleParts] = useState({
    enamel: true,
    dentin: true,
    pulp: true,
    roots: true,
    nerves: true,
    bloodVessels: true,
    periodontal: true,
    cementum: true,
    gingiva: true
  });

  // بيانات أجزاء الضرس مع تفاصيل تشريحية دقيقة
  const molarParts = {
    enamel: {
      name: "المينا (Enamel)",
      description: "الطبقة الخارجية الصلبة البيضاء التي تغطي تاج الضرس",
      color: "#ffffff",
      strokeColor: "#e6e6fa",
      details: "أصلب مادة في جسم الإنسان، تتكون من هيدروكسي أباتيت الكالسيوم. سماكتها 2.5 ملم في المناطق المضغية وتحتوي على 96% معادن و4% ماء ومواد عضوية",
      thickness: "2.5 ملم في المناطق المضغية",
      composition: "96% معادن، 4% ماء ومواد عضوية",
      hardness: "5 على مقياس موس (أصلب من الصلب)"
    },
    dentin: {
      name: "العاج (Dentin)",
      description: "النسيج الصلب الذي يشكل الجزء الأكبر من بنية الضرس",
      color: "#fff8dc",
      strokeColor: "#f0e68c",
      details: "يحتوي على 45,000 أنبوب عاجي دقيق لكل ملم مربع تنقل الإحساس. يتجدد طوال الحياة ويشكل 70% من حجم السن",
      composition: "70% معادن، 20% مواد عضوية، 10% ماء",
      tubules: "45,000 أنبوب عاجي/ملم²"
    },
    pulp: {
      name: "اللب السني (Pulp Chamber)",
      description: "التجويف المركزي الذي يحتوي على الأعصاب والأوعية الدموية",
      color: "#ffb6c1",
      strokeColor: "#ff69b4",
      details: "يحتوي على خلايا مولدة للعاج، 400 ليف عصبي، وشبكة معقدة من الأوعية الدموية واللمفاوية",
      nerves: "400 ليف عصبي",
      cells: "خلايا مولدة للعاج (Odontoblasts)"
    },
    roots: {
      name: "الجذور (Roots)",
      description: "جذور الضرس (2-3 جذور) المدفونة في عظم الفك",
      color: "#f0f8ff",
      strokeColor: "#b0c4de",
      details: "الضرس العلوي له 3 جذور (2 شدقية، 1 حنكية)، السفلي له جذران (أمامي وخلفي). الطول متوسط 12-14 ملم",
      upperMolar: "3 جذور (2 شدقية، 1 حنكية)",
      lowerMolar: "2 جذر (أمامي وخلفي)",
      averageLength: "12-14 ملم"
    },
    nerves: {
      name: "الألياف العصبية (Nerve Fibers)",
      description: "الأعصاب التي تنقل الإحساس بالألم والحرارة",
      color: "#ffff00",
      strokeColor: "#ffd700",
      details: "تنتمي للعصب الثلاثي التوائم، سرعة نقل الإشارة 30 م/ث، تستجيب لتغيرات الحرارة 0.5 درجة مئوية",
      speed: "30 متر/ثانية لنقل الإشارة",
      sensitivity: "تستجيب لتغير 0.5°م في الحرارة"
    },
    bloodVessels: {
      name: "الأوعية الدموية (Blood Vessels)",
      description: "الشرايين والأوردة التي تغذي الضرس",
      color: "#dc143c",
      strokeColor: "#b22222",
      details: "تزود اللب بـ 15-20 مل دم/دقيقة، تحتوي على شعيرات دموية بقطر 8-12 ميكرومتر",
      bloodFlow: "15-20 مل/دقيقة",
      capillarySize: "8-12 ميكرومتر قطر الشعيرات"
    },
    periodontal: {
      name: "الرباط السني (Periodontal Ligament)",
      description: "الألياف التي تربط جذر الضرس بعظم الفك",
      color: "#90ee90",
      strokeColor: "#32cd32",
      details: "يحتوي على ألياف كولاجينية بعرض 0.15-0.38 ملم، ومستقبلات حسية تتحمل قوة عض 200 كيلو",
      thickness: "0.15-0.38 ملم",
      bitingForce: "يتحمل قوة عض 200 كيلو"
    },
    cementum: {
      name: "الملاط (Cementum)",
      description: "الطبقة الرقيقة التي تغطي جذر السن",
      color: "#f5f5dc",
      strokeColor: "#daa520",
      details: "طبقة رقيقة بسماكة 20-200 ميكرومتر، تتكون من 65% معادن و35% مواد عضوية",
      thickness: "20-200 ميكرومتر",
      composition: "65% معادن، 35% مواد عضوية"
    },
    gingiva: {
      name: "اللثة (Gingiva)",
      description: "النسيج اللثوي الذي يحيط بالسن",
      color: "#ffc0cb",
      strokeColor: "#ff69b4",
      details: "نسيج ضام كثيف مغطى بظهارة طبقية، سماكة 1-3 ملم، يتجدد كل 4-6 أيام",
      thickness: "1-3 ملم",
      renewal: "يتجدد كل 4-6 أيام"
    }
  };

  // رسم الضرس الواقعي مع التفاصيل التشريحية الدقيقة
  const drawRealisticMolar = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    // تنظيف الكانفاس وإعداد الخلفية
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // خلفية متدرجة لمحاكاة الفم
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#fef7f7');
    gradient.addColorStop(0.3, '#fdf2f8');
    gradient.addColorStop(0.7, '#f0f9ff');
    gradient.addColorStop(1, '#ecfdf5');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.scale(zoom, zoom);

    // تطبيق الدوران لمحاكاة ثلاثية الأبعاد
    const rotX = rotation.x * Math.PI / 180;
    const rotY = rotation.y * Math.PI / 180;

    // رسم اللثة والعظم السنخي
    if (visibleParts.gingiva) {
      drawGingivaAndBone(ctx);
    }

    // رسم الجذور مع الملاط
    if (visibleParts.roots) {
      drawMolarRootsWithCementum(ctx, rotY);
    }

    // رسم الرباط السني
    if (visibleParts.periodontal) {
      drawPeriodontalLigament(ctx);
    }

    // رسم العاج مع الأنابيب العاجية
    if (visibleParts.dentin) {
      drawDentinWithTubules(ctx, rotY);
    }

    // رسم المينا مع البنية المنشورية
    if (visibleParts.enamel) {
      drawEnamelWithPrisms(ctx, rotY);
    }

    // رسم تجويف اللب مع قرون اللب
    if (visibleParts.pulp) {
      drawPulpChamberDetailed(ctx, rotY);
    }

    // رسم الأعصاب والأوعية الدموية مع التفاصيل
    if (visibleParts.nerves || visibleParts.bloodVessels) {
      drawNeurovascularBundle(ctx);
    }

    // إضافة تفاصيل السطح المضغي الواقعية
    if (visibleParts.enamel) {
      drawDetailedOcclusalSurface(ctx);
    }

    ctx.restore();
  };

  // رسم اللثة والعظم السنخي
  const drawGingivaAndBone = (ctx: CanvasRenderingContext2D) => {
    ctx.save();
    
    // العظم السنخي
    const boneGradient = ctx.createLinearGradient(0, 50, 0, 120);
    boneGradient.addColorStop(0, '#f5f5dc');
    boneGradient.addColorStop(1, '#daa520');
    ctx.fillStyle = boneGradient;
    ctx.beginPath();
    ctx.ellipse(0, 70, 90, 25, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // اللثة
    const gingivaGradient = ctx.createRadialGradient(0, 40, 10, 0, 40, 80);
    gingivaGradient.addColorStop(0, '#ffb6c1');
    gingivaGradient.addColorStop(0.6, '#ffc0cb');
    gingivaGradient.addColorStop(1, '#ff91a4');
    ctx.fillStyle = gingivaGradient;
    ctx.beginPath();
    ctx.ellipse(0, 40, 75, 18, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // حواف اللثة الحرة
    ctx.strokeStyle = selectedPart === 'gingiva' ? '#2563eb' : '#ff69b4';
    ctx.lineWidth = selectedPart === 'gingiva' ? 3 : 1.5;
    ctx.beginPath();
    ctx.ellipse(0, 35, 65, 15, 0, 0, Math.PI * 2);
    ctx.stroke();
    
    ctx.restore();
  };

  // رسم الجذور مع الملاط
  const drawMolarRootsWithCementum = (ctx: CanvasRenderingContext2D, rotY: number) => {
    const shadowOffset = Math.sin(rotY) * 3;
    
    ctx.save();
    
    // رسم الظلال
    ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
    drawRootWithCementum(ctx, -5 + shadowOffset, 45 + shadowOffset, 28, 95, true, false);
    drawRootWithCementum(ctx, -38 + shadowOffset, 50 + shadowOffset, 22, 88, false, false);
    drawRootWithCementum(ctx, 28 + shadowOffset, 50 + shadowOffset, 22, 88, false, false);

    // رسم الجذور الفعلية
    drawRootWithCementum(ctx, -5, 45, 28, 95, true, true);
    drawRootWithCementum(ctx, -38, 50, 22, 88, false, true);
    drawRootWithCementum(ctx, 28, 50, 22, 88, false, true);
    
    ctx.restore();
  };

  // رسم جذر واحد مع الملاط
  const drawRootWithCementum = (ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, isMain: boolean, drawDetails: boolean) => {
    if (!drawDetails) {
      // رسم الظل فقط
      drawRootShape(ctx, x, y, width, height, isMain);
      return;
    }

    // رسم العاج في الجذر
    const dentinPart = molarParts.dentin;
    ctx.fillStyle = dentinPart.color;
    ctx.strokeStyle = selectedPart === 'dentin' ? '#2563eb' : dentinPart.strokeColor;
    ctx.lineWidth = selectedPart === 'dentin' ? 3 : 1.5;
    drawRootShape(ctx, x, y, width * 0.85, height, isMain);
    ctx.fill();
    ctx.stroke();

    // رسم الملاط
    if (visibleParts.cementum) {
      const cementumPart = molarParts.cementum;
      ctx.strokeStyle = selectedPart === 'cementum' ? '#2563eb' : cementumPart.strokeColor;
      ctx.lineWidth = selectedPart === 'cementum' ? 3 : 2;
      drawRootShape(ctx, x, y, width, height, isMain);
      ctx.stroke();
      
      // خطوط الملاط الطبقية
      ctx.strokeStyle = 'rgba(218, 165, 32, 0.3)';
      ctx.lineWidth = 0.8;
      for (let i = 1; i <= 3; i++) {
        drawRootShape(ctx, x, y, width * (0.9 + i * 0.03), height * (1 + i * 0.02), isMain);
        ctx.stroke();
      }
    }

    // قناة الجذر
    ctx.fillStyle = molarParts.pulp.color;
    ctx.strokeStyle = selectedPart === 'pulp' ? '#2563eb' : molarParts.pulp.strokeColor;
    ctx.lineWidth = selectedPart === 'pulp' ? 2 : 1;
    drawRootShape(ctx, x, y, width * 0.2, height * 0.8, isMain);
    ctx.fill();
    ctx.stroke();
  };

  // رسم شكل الجذر المخروطي
  const drawRootShape = (ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, isMain: boolean) => {
    ctx.beginPath();
    if (isMain) {
      // الجذر الرئيسي - مخروطي ومنحني قليلاً
      ctx.moveTo(x - width/2, y);
      ctx.quadraticCurveTo(x - width/2.2, y + height/4, x - width/3, y + height * 0.6);
      ctx.quadraticCurveTo(x - width/6, y + height * 0.85, x, y + height);
      ctx.quadraticCurveTo(x + width/6, y + height * 0.85, x + width/3, y + height * 0.6);
      ctx.quadraticCurveTo(x + width/2.2, y + height/4, x + width/2, y);
    } else {
      // الجذور الجانبية - أكثر استقامة
      ctx.moveTo(x - width/2, y);
      ctx.quadraticCurveTo(x - width/2.5, y + height * 0.3, x - width/3.5, y + height * 0.7);
      ctx.lineTo(x - width/6, y + height);
      ctx.lineTo(x + width/6, y + height);
      ctx.quadraticCurveTo(x + width/3.5, y + height * 0.7, x + width/2.5, y + height * 0.3);
      ctx.lineTo(x + width/2, y);
    }
    ctx.closePath();
  };

  // رسم العاج مع الأنابيب العاجية
  const drawDentinWithTubules = (ctx: CanvasRenderingContext2D, rotY: number) => {
    const part = molarParts.dentin;
    const shadowOffset = Math.sin(rotY) * 2;
    
    ctx.save();
    
    // رسم الظل
    ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
    drawMolarCrownShape(ctx, shadowOffset, shadowOffset, 0.88);
    
    // رسم العاج
    const dentinGradient = ctx.createRadialGradient(0, -10, 15, 0, -10, 45);
    dentinGradient.addColorStop(0, '#fffacd');
    dentinGradient.addColorStop(0.7, '#fff8dc');
    dentinGradient.addColorStop(1, '#f0e68c');
    ctx.fillStyle = dentinGradient;
    ctx.strokeStyle = selectedPart === 'dentin' ? '#2563eb' : part.strokeColor;
    ctx.lineWidth = selectedPart === 'dentin' ? 3 : 1.5;
    
    drawMolarCrownShape(ctx, 0, 0, 0.88);
    ctx.fill();
    ctx.stroke();
    
    // الأنابيب العاجية - خطوط شعاعية دقيقة
    ctx.strokeStyle = 'rgba(240, 230, 140, 0.4)';
    ctx.lineWidth = 0.3;
    for (let i = 0; i < 24; i++) {
      const angle = (i / 24) * Math.PI * 2;
      const startRadius = 12;
      const endRadius = 35;
      ctx.beginPath();
      ctx.moveTo(
        Math.cos(angle) * startRadius, 
        -18 + Math.sin(angle) * startRadius
      );
      ctx.lineTo(
        Math.cos(angle) * endRadius, 
        -8 + Math.sin(angle) * endRadius
      );
      ctx.stroke();
    }
    
    // خطوط العاج الثانوي
    ctx.strokeStyle = 'rgba(240, 230, 140, 0.2)';
    ctx.lineWidth = 0.8;
    for (let i = 0; i < 4; i++) {
      const radius = 18 + i * 8;
      ctx.beginPath();
      ctx.arc(0, -15, radius, 0, Math.PI * 2);
      ctx.stroke();
    }
    
    ctx.restore();
  };

  // رسم المينا مع البنية المنشورية
  const drawEnamelWithPrisms = (ctx: CanvasRenderingContext2D, rotY: number) => {
    const part = molarParts.enamel;
    const shadowOffset = Math.sin(rotY) * 2;
    
    ctx.save();
    
    // رسم الظل
    ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
    drawMolarCrownShape(ctx, shadowOffset, shadowOffset, 1);
    
    // رسم المينا مع التدرج اللؤلؤي
    const enamelGradient = ctx.createLinearGradient(-35, -45, 35, 25);
    enamelGradient.addColorStop(0, '#ffffff');
    enamelGradient.addColorStop(0.3, '#fdfbff');
    enamelGradient.addColorStop(0.7, '#f8f8ff');
    enamelGradient.addColorStop(1, '#f0f8ff');
    ctx.fillStyle = enamelGradient;
    ctx.strokeStyle = selectedPart === 'enamel' ? '#2563eb' : part.strokeColor;
    ctx.lineWidth = selectedPart === 'enamel' ? 3 : 1.5;
    
    drawMolarCrownShape(ctx, 0, 0, 1);
    ctx.fill();
    ctx.stroke();
    
    // منشورات المينا - خطوط متموجة دقيقة
    ctx.strokeStyle = 'rgba(230, 230, 250, 0.6)';
    ctx.lineWidth = 0.5;
    for (let i = 0; i < 8; i++) {
      ctx.beginPath();
      const startX = -30 + i * 8;
      ctx.moveTo(startX, -40);
      ctx.quadraticCurveTo(startX + 2, -25, startX - 1, -10);
      ctx.quadraticCurveTo(startX + 3, 5, startX, 20);
      ctx.stroke();
    }
    
    // لمعة المينا المتقزحة
    const glossGradient = ctx.createLinearGradient(-25, -35, 25, 15);
    glossGradient.addColorStop(0, 'rgba(255, 255, 255, 0.6)');
    glossGradient.addColorStop(0.3, 'rgba(240, 248, 255, 0.3)');
    glossGradient.addColorStop(0.7, 'rgba(255, 255, 255, 0.1)');
    glossGradient.addColorStop(1, 'rgba(255, 255, 255, 0.05)');
    ctx.fillStyle = glossGradient;
    drawMolarCrownShape(ctx, 0, 0, 1);
    ctx.fill();
    
    ctx.restore();
  };

  // رسم شكل تاج الضرس الواقعي
  const drawMolarCrownShape = (ctx: CanvasRenderingContext2D, offsetX: number, offsetY: number, scale: number) => {
    ctx.beginPath();
    // شكل الضرس الواقعي مع انحناءات طبيعية
    ctx.moveTo(-35 * scale + offsetX, -30 * scale + offsetY);
    ctx.quadraticCurveTo(-42 * scale + offsetX, -42 * scale + offsetY, -35 * scale + offsetX, -48 * scale + offsetY);
    ctx.quadraticCurveTo(-18 * scale + offsetX, -52 * scale + offsetY, 0 * scale + offsetX, -50 * scale + offsetY);
    ctx.quadraticCurveTo(18 * scale + offsetX, -52 * scale + offsetY, 35 * scale + offsetX, -48 * scale + offsetY);
    ctx.quadraticCurveTo(42 * scale + offsetX, -42 * scale + offsetY, 35 * scale + offsetX, -30 * scale + offsetY);
    ctx.lineTo(35 * scale + offsetX, 25 * scale + offsetY);
    ctx.quadraticCurveTo(35 * scale + offsetX, 35 * scale + offsetY, 25 * scale + offsetX, 40 * scale + offsetY);
    ctx.lineTo(-25 * scale + offsetX, 40 * scale + offsetY);
    ctx.quadraticCurveTo(-35 * scale + offsetX, 35 * scale + offsetY, -35 * scale + offsetX, 25 * scale + offsetY);
    ctx.closePath();
  };

  // رسم تجويف اللب المفصل مع قرون اللب
  const drawPulpChamberDetailed = (ctx: CanvasRenderingContext2D, rotY: number) => {
    const part = molarParts.pulp;
    const shadowOffset = Math.sin(rotY) * 1;
    
    ctx.save();
    
    // رسم الظل
    ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
    drawPulpShape(ctx, shadowOffset, shadowOffset);
    
    // رسم اللب الرئيسي
    const pulpGradient = ctx.createRadialGradient(0, -15, 5, 0, -15, 25);
    pulpGradient.addColorStop(0, '#ff91a4');
    pulpGradient.addColorStop(0.6, '#ffb6c1');
    pulpGradient.addColorStop(1, '#ffc0cb');
    ctx.fillStyle = pulpGradient;
    ctx.strokeStyle = selectedPart === 'pulp' ? '#2563eb' : part.strokeColor;
    ctx.lineWidth = selectedPart === 'pulp' ? 3 : 1.5;
    
    drawPulpShape(ctx, 0, 0);
    ctx.fill();
    ctx.stroke();
    
    // قرون اللب (امتدادات نحو الحدبات)
    const hornPositions = [
      { x: -18, y: -28, size: 5 },
      { x: 18, y: -28, size: 5 },
      { x: -12, y: -32, size: 4 },
      { x: 12, y: -32, size: 4 }
    ];
    
    hornPositions.forEach(horn => {
      ctx.beginPath();
      ctx.ellipse(horn.x, horn.y, horn.size, horn.size * 1.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    });
    
    ctx.restore();
  };

  // رسم شكل تجويف اللب
  const drawPulpShape = (ctx: CanvasRenderingContext2D, offsetX: number, offsetY: number) => {
    ctx.beginPath();
    // شكل تجويف اللب الطبيعي
    ctx.moveTo(-22 + offsetX, -18 + offsetY);
    ctx.quadraticCurveTo(-28 + offsetX, -32 + offsetY, -18 + offsetX, -38 + offsetY);
    ctx.quadraticCurveTo(0 + offsetX, -42 + offsetY, 18 + offsetX, -38 + offsetY);
    ctx.quadraticCurveTo(28 + offsetX, -32 + offsetY, 22 + offsetX, -18 + offsetY);
    ctx.lineTo(22 + offsetX, 18 + offsetY);
    ctx.quadraticCurveTo(18 + offsetX, 28 + offsetY, 8 + offsetX, 32 + offsetY);
    ctx.lineTo(-8 + offsetX, 32 + offsetY);
    ctx.quadraticCurveTo(-18 + offsetX, 28 + offsetY, -22 + offsetX, 18 + offsetY);
    ctx.closePath();
  };

  // رسم السطح المضغي المفصل
  const drawDetailedOcclusalSurface = (ctx: CanvasRenderingContext2D) => {
    ctx.save();
    
    // الحفر والشقوق الرئيسية
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.lineWidth = 2;
    
    // الحفرة المركزية
    ctx.beginPath();
    ctx.ellipse(0, -38, 12, 6, 0, 0, Math.PI * 2);
    ctx.stroke();
    
    // الحفر الثانوية
    const secondaryPits = [
      { x: -22, y: -30, w: 8, h: 4 },
      { x: 22, y: -30, w: 8, h: 4 },
      { x: -15, y: -25, w: 6, h: 3 },
      { x: 15, y: -25, w: 6, h: 3 }
    ];
    
    secondaryPits.forEach(pit => {
      ctx.beginPath();
      ctx.ellipse(pit.x, pit.y, pit.w, pit.h, 0, 0, Math.PI * 2);
      ctx.stroke();
    });
    
    // الشقوق والأخاديد
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.25)';
    
    // الشق المركزي
    ctx.beginPath();
    ctx.moveTo(-28, -38);
    ctx.quadraticCurveTo(0, -32, 28, -38);
    ctx.stroke();
    
    // الشقوق المعترضة
    ctx.beginPath();
    ctx.moveTo(0, -48);
    ctx.quadraticCurveTo(8, -25, 0, -15);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(-25, -35);
    ctx.quadraticCurveTo(-15, -20, -5, -18);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(25, -35);
    ctx.quadraticCurveTo(15, -20, 5, -18);
    ctx.stroke();
    
    // الحدبات (التضاريس المرتفعة)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    
    const cusps = [
      { x: -20, y: -40, r: 8 },
      { x: 20, y: -40, r: 8 },
      { x: -20, y: -20, r: 7 },
      { x: 20, y: -20, r: 7 }
    ];
    
    cusps.forEach(cusp => {
      ctx.beginPath();
      ctx.arc(cusp.x, cusp.y, cusp.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    });
    
    ctx.restore();
  };

  // رسم الرباط السني المفصل
  const drawPeriodontalLigament = (ctx: CanvasRenderingContext2D) => {
    if (!visibleParts.periodontal) return;
    
    const part = molarParts.periodontal;
    ctx.save();
    ctx.strokeStyle = selectedPart === 'periodontal' ? '#2563eb' : part.color;
    ctx.lineWidth = selectedPart === 'periodontal' ? 3 : 1.5;
    
    // ألياف الرباط السني - أنماط مختلفة
    const fiberGroups = [
      { name: 'horizontal', angle: 0, radius: 50, count: 12 },
      { name: 'oblique', angle: Math.PI / 4, radius: 55, count: 10 },
      { name: 'apical', angle: Math.PI / 2, radius: 45, count: 8 }
    ];
    
    fiberGroups.forEach(group => {
      for (let i = 0; i < group.count; i++) {
        const baseAngle = (i / group.count) * Math.PI * 2;
        const startRadius = group.radius - 5;
        const endRadius = group.radius + 5;
        
        ctx.beginPath();
        ctx.moveTo(
          Math.cos(baseAngle) * startRadius, 
          70 + Math.sin(baseAngle) * startRadius
        );
        ctx.lineTo(
          Math.cos(baseAngle + group.angle * 0.1) * endRadius, 
          70 + Math.sin(baseAngle + group.angle * 0.1) * endRadius
        );
        ctx.stroke();
      }
    });
    
    ctx.restore();
  };

  // رسم الحزمة العصبية الوعائية
  const drawNeurovascularBundle = (ctx: CanvasRenderingContext2D) => {
    ctx.save();
    
    if (visibleParts.nerves) {
      // الألياف العصبية الرئيسية
      ctx.strokeStyle = selectedPart === 'nerves' ? '#2563eb' : molarParts.nerves.color;
      ctx.lineWidth = selectedPart === 'nerves' ? 3 : 2.5;
      
      // العصب الرئيسي
      ctx.beginPath();
      ctx.moveTo(-2, 32);
      ctx.quadraticCurveTo(-4, 65, -1, 98);
      ctx.quadraticCurveTo(1, 130, -3, 165);
      ctx.stroke();
      
      // التفرعات العصبية إلى الجذور
      ctx.lineWidth = 1.8;
      const nerveColors = ['#ffff00', '#ffd700', '#ffed4e'];
      nerveColors.forEach((color, index) => {
        ctx.strokeStyle = color;
        ctx.beginPath();
        ctx.moveTo(-2, 45 + index * 5);
        ctx.quadraticCurveTo(-20 - index * 8, 75, -30 - index * 5, 105);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(-2, 45 + index * 5);
        ctx.quadraticCurveTo(16 + index * 8, 75, 26 + index * 5, 105);
        ctx.stroke();
      });
      
      // التفرعات العصبية الدقيقة داخل اللب
      ctx.lineWidth = 0.8;
      ctx.strokeStyle = 'rgba(255, 255, 0, 0.6)';
      for (let i = 0; i < 12; i++) {
        const angle = (i / 12) * Math.PI * 2;
        const startX = Math.cos(angle) * 6;
        const startY = -12 + Math.sin(angle) * 6;
        const endX = Math.cos(angle) * 16;
        const endY = -8 + Math.sin(angle) * 16;
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();
      }
    }
    
    if (visibleParts.bloodVessels) {
      // الأوعية الدموية
      ctx.strokeStyle = selectedPart === 'bloodVessels' ? '#2563eb' : molarParts.bloodVessels.color;
      ctx.lineWidth = selectedPart === 'bloodVessels' ? 3 : 2.2;
      
      // الوعاء الدموي الرئيسي (الشريان)
      ctx.beginPath();
      ctx.moveTo(5, 32);
      ctx.quadraticCurveTo(8, 68, 5, 102);
      ctx.quadraticCurveTo(3, 135, 7, 170);
      ctx.stroke();
      
      // الوريد المصاحب
      ctx.strokeStyle = '#8b0000';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(9, 35);
      ctx.quadraticCurveTo(12, 70, 9, 105);
      ctx.quadraticCurveTo(7, 138, 11, 173);
      ctx.stroke();
      
      // التفرعات الوعائية
      ctx.strokeStyle = '#dc143c';
      ctx.lineWidth = 1.5;
      const vesselBranches = [
        { start: { x: 5, y: 50 }, end: { x: 25, y: 80 } },
        { start: { x: 5, y: 50 }, end: { x: -15, y: 80 } },
        { start: { x: 5, y: 65 }, end: { x: 30, y: 95 } },
        { start: { x: 5, y: 65 }, end: { x: -20, y: 95 } }
      ];
      
      vesselBranches.forEach(branch => {
        ctx.beginPath();
        ctx.moveTo(branch.start.x, branch.start.y);
        ctx.quadraticCurveTo(
          (branch.start.x + branch.end.x) / 2 + 5,
          (branch.start.y + branch.end.y) / 2,
          branch.end.x,
          branch.end.y
        );
        ctx.stroke();
      });
      
      // الشعيرات الدموية الدقيقة
      ctx.lineWidth = 0.6;
      ctx.strokeStyle = 'rgba(220, 20, 60, 0.7)';
      for (let i = 0; i < 16; i++) {
        const angle = (i / 16) * Math.PI * 2;
        const startX = 4 + Math.cos(angle) * 10;
        const startY = -8 + Math.sin(angle) * 10;
        const endX = 6 + Math.cos(angle) * 18;
        const endY = -4 + Math.sin(angle) * 18;
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();
      }
    }
    
    ctx.restore();
  };

  // باقي الكود مثل التعامل مع النقر والحركة والتحكم...
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left - canvas.width / 2) / zoom;
    const y = (e.clientY - rect.top - canvas.height / 2) / zoom;

    let clickedPart: string | null = null;

    // تحديد الجزء بناءً على موقع النقر مع دقة أكبر
    if (y > 60 && y < 170) {
      clickedPart = 'roots';
    } else if (y > 35 && y < 55) {
      clickedPart = 'gingiva';
    } else if (y > -50 && y < 45) {
      const distance = Math.sqrt(x * x + (y + 10) * (y + 10));
      if (distance < 12) {
        clickedPart = 'pulp';
      } else if (distance < 28) {
        clickedPart = 'dentin';
      } else if (distance < 40) {
        clickedPart = 'enamel';
      }
    }

    // التحقق من النقر على الأعصاب والأوعية الدموية
    if (Math.abs(x + 2) < 8 && y > 32 && y < 170) {
      clickedPart = 'nerves';
    } else if (Math.abs(x - 6) < 8 && y > 32 && y < 170) {
      clickedPart = 'bloodVessels';
    }

    // التحقق من الرباط السني
    if (Math.abs(x) > 45 && Math.abs(x) < 65 && y > 65 && y < 85) {
      clickedPart = 'periodontal';
    }

    // التحقق من الملاط
    if (Math.abs(x) > 35 && Math.abs(x) < 50 && y > 45 && y < 140) {
      clickedPart = 'cementum';
    }

    setSelectedPart(clickedPart);
  };

  // التعامل مع الحركة والدوران
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) {
      setIsDragging(true);
      setLastMousePos({ x: e.clientX, y: e.clientY });
      e.preventDefault();
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;

    const deltaX = e.clientX - lastMousePos.x;
    const deltaY = e.clientY - lastMousePos.y;

    setRotation(prev => ({
      x: Math.max(-45, Math.min(45, prev.x + deltaY * 0.5)),
      y: prev.y + deltaX * 0.5
    }));

    setLastMousePos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom(prev => Math.max(0.5, Math.min(2.5, prev * zoomFactor)));
  };

  // Effects
  useEffect(() => {
    drawRealisticMolar();
  }, [rotation, zoom, selectedPart, visibleParts]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.addEventListener('mousedown', handleMouseDown as any);
    canvas.addEventListener('wheel', handleWheel);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown as any);
      canvas.removeEventListener('wheel', handleWheel);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, lastMousePos]);

  return (
    <div className="max-w-7xl mx-auto p-6 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-3 flex items-center justify-center gap-3">
          <Microscope className="w-10 h-10 text-blue-600" />
          النموذج التشريحي الواقعي للضرس
        </h1>
        <p className="text-gray-600 text-lg">
          نموذج ثلاثي الأبعاد تفاعلي مبني على المراجع التشريحية الطبية
        </p>
        <div className="flex items-center justify-center gap-4 mt-2 text-sm text-gray-500">
          <span className="flex items-center gap-1">
            <MousePointer className="w-4 h-4" />
            اسحب للدوران
          </span>
          <span>•</span>
          <span>عجلة الفأرة للتكبير</span>
          <span>•</span>  
          <span>انقر على الأجزاء للتفاصيل</span>
        </div>
      </div>

      <div className="flex gap-6">
        {/* النموذج الرئيسي */}
        <div className="flex-1">
          <div className="bg-white rounded-xl shadow-2xl p-6">
            {/* أدوات التحكم */}
            <div className="flex justify-between items-center mb-6">
              <div className="flex gap-3">
                <button
                  onClick={() => setZoom(prev => Math.min(prev + 0.3, 2.5))}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-100 hover:bg-blue-200 rounded-lg transition-colors font-medium"
                >
                  <ZoomIn className="w-4 h-4" />
                  تكبير
                </button>
                <button
                  onClick={() => setZoom(prev => Math.max(prev - 0.3, 0.5))}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-100 hover:bg-blue-200 rounded-lg transition-colors font-medium"
                >
                  <ZoomOut className="w-4 h-4" />
                  تصغير
                </button>
                <button
                  onClick={() => {
                    setRotation({ x: -10, y: 15 });
                    setZoom(1.2);
                    setSelectedPart(null);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium"
                >
                  <RotateCcw className="w-4 h-4" />
                  إعادة تعيين
                </button>
              </div>
              
              <div className="text-sm text-gray-500 bg-gray-50 px-3 py-2 rounded-lg">
                التكبير: {Math.round(zoom * 100)}%
              </div>
            </div>

            {/* الكانفاس الرئيسي */}
            <div className="relative">
              <canvas
                ref={canvasRef}
                width={700}
                height={600}
                className="border-2 border-gray-200 rounded-xl cursor-move bg-gradient-to-b from-gray-50 to-white shadow-inner"
                onClick={handleCanvasClick}
                style={{ touchAction: 'none' }}
              />
              
              {selectedPart && (
                <div className="absolute top-4 left-4 bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-medium shadow-lg">
                  {molarParts[selectedPart]?.name}
                </div>
              )}
            </div>
          </div>

          {/* التحكم في الرؤية */}
          <div className="bg-white rounded-xl shadow-xl p-5 mt-6">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Eye className="w-5 h-5 text-blue-600" />
              التحكم في عرض الأجزاء التشريحية
            </h3>
            <div className="grid grid-cols-3 gap-3">
              {Object.entries(molarParts).map(([partKey, part]) => (
                <label key={partKey} className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-gray-50 transition-colors">
                  <input
                    type="checkbox"
                    checked={visibleParts[partKey as keyof typeof visibleParts]}
                    onChange={(e) => setVisibleParts(prev => ({
                      ...prev,
                      [partKey]: e.target.checked
                    }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div
                    className="w-4 h-4 rounded-full border border-gray-300"
                    style={{ backgroundColor: part.color }}
                  ></div>
                  <span className="text-sm font-medium text-gray-700">
                    {part.name.split(' ')[0]}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* لوحة المعلومات المحسنة */}
        <div className="w-96">
          {selectedPart ? (
            <div className="bg-white rounded-xl shadow-xl p-6 sticky top-6">
              <div className="flex items-center gap-3 mb-5">
                <div
                  className="w-8 h-8 rounded-full border-2 border-white shadow-lg"
                  style={{ backgroundColor: molarParts[selectedPart].color }}
                ></div>
                <h3 className="font-bold text-xl text-gray-800 flex-1">
                  {molarParts[selectedPart].name}
                </h3>
                <button
                  onClick={() => setSelectedPart(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-700 mb-2">الوصف:</h4>
                  <p className="text-gray-600 leading-relaxed">
                    {molarParts[selectedPart].description}
                  </p>
                </div>
                
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                  <div className="flex items-center gap-2 mb-3">
                    <Info className="w-5 h-5 text-blue-600" />
                    <h4 className="font-semibold text-blue-800">معلومات تشريحية دقيقة</h4>
                  </div>
                  <p className="text-blue-700 text-sm leading-relaxed mb-3">
                    {molarParts[selectedPart].details}
                  </p>
                  
                  {/* معلومات إضافية حسب النوع */}
                  {selectedPart === 'enamel' && (
                    <div className="space-y-2 text-xs text-blue-600">
                      <p><strong>السماكة:</strong> {(molarParts[selectedPart] as any).thickness}</p>
                      <p><strong>التكوين:</strong> {(molarParts[selectedPart] as any).composition}</p>
                      <p><strong>الصلابة:</strong> {(molarParts[selectedPart] as any).hardness}</p>
                    </div>
                  )}
                  
                  {selectedPart === 'dentin' && (
                    <div className="space-y-2 text-xs text-blue-600">
                      <p><strong>التكوين:</strong> {(molarParts[selectedPart] as any).composition}</p>
                      <p><strong>الأنابيب العاجية:</strong> {(molarParts[selectedPart] as any).tubules}</p>
                    </div>
                  )}
                  
                  {selectedPart === 'pulp' && (
                    <div className="space-y-2 text-xs text-blue-600">
                      <p><strong>الألياف العصبية:</strong> {(molarParts[selectedPart] as any).nerves}</p>
                      <p><strong>الخلايا الرئيسية:</strong> {(molarParts[selectedPart] as any).cells}</p>
                    </div>
                  )}
                  
                  {selectedPart === 'nerves' && (
                    <div className="space-y-2 text-xs text-blue-600">
                      <p><strong>سرعة النقل:</strong> {(molarParts[selectedPart] as any).speed}</p>
                      <p><strong>الحساسية:</strong> {(molarParts[selectedPart] as any).sensitivity}</p>
                    </div>
                  )}
                  
                  {selectedPart === 'bloodVessels' && (
                    <div className="space-y-2 text-xs text-blue-600">
                      <p><strong>تدفق الدم:</strong> {(molarParts[selectedPart] as any).bloodFlow}</p>
                      <p><strong>حجم الشعيرات:</strong> {(molarParts[selectedPart] as any).capillarySize}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-xl p-6 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Microscope className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="font-bold text-gray-700 mb-2">استكشف التشريح المفصل</h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                انقر على أي جزء من الضرس لعرض معلوماته التشريحية المبنية على المراجع الطبية
              </p>
            </div>
          )}

          {/* دليل الأجزاء المحسن */}
          <div className="bg-white rounded-xl shadow-xl p-5 mt-6">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Book className="w-5 h-5 text-blue-600" />
              دليل الأجزاء التشريحية
            </h3>
            <div className="space-y-3">
              {Object.entries(molarParts).map(([partKey, part]) => (
                <button
                  key={partKey}
                  onClick={() => setSelectedPart(partKey)}
                  className={`w-full text-right p-3 rounded-lg transition-all duration-200 border ${
                    selectedPart === partKey 
                      ? 'bg-blue-50 border-blue-300 shadow-md transform scale-105' 
                      : 'hover:bg-gray-50 border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded-full border border-gray-300 shadow-sm"
                      style={{ backgroundColor: part.color }}
                    ></div>
                    <div className="flex-1">
                      <span className="text-sm font-semibold text-gray-800 block">
                        {part.name}
                      </span>
                      <span className="text-xs text-gray-500 block mt-1">
                        انقر لعرض التفاصيل التشريحية
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* حقائق تشريحية */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-5 mt-6 border border-green-200">
            <h3 className="font-bold text-green-800 mb-3 flex items-center gap-2">
              <Heart className="w-5 h-5" />
              حقائق تشريحية مذهلة
            </h3>
            <div className="space-y-2 text-sm text-green-700">
              <p>• المينا أصلب من الصلب بـ 5 مرات</p>
              <p>• العاج يحتوي على 45,000 أنبوب/ملم²</p>
              <p>• الضرس يتحمل قوة عض 200 كيلو</p>
              <p>• اللب يحتوي على 400 ليف عصبي</p>
              <p>• الأعصاب تنقل الإشارة بسرعة 30 م/ث</p>
              <p>• تدفق الدم في اللب 15-20 مل/دقيقة</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RealisticToothAnatomy;