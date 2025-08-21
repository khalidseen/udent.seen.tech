import { pipeline, env } from '@huggingface/transformers';

// Configure transformers.js to use browser cache
env.allowLocalModels = false;
env.useBrowserCache = true;

export interface AIAnalysisResult {
  confidence: number;
  detectedConditions: string[];
  recommendations: string[];
  analysisData: Record<string, any>;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

export interface XRayAnalysisResult extends AIAnalysisResult {
  toothConditions: {
    toothNumber?: string;
    conditions: string[];
    severity: number;
  }[];
  overallOralHealth: string;
}

export interface DSDAnalysisResult extends AIAnalysisResult {
  facialSymmetry: number;
  smileAesthetics: string[];
  treatmentSuggestions: string[];
  beforeAfterComparison?: {
    improvements: string[];
    score: number;
  };
}

class AIAnalysisService {
  private imageClassifier: any = null;
  private textGenerator: any = null;
  
  async initializeModels() {
    try {
      // Initialize image classification model for dental X-rays
      if (!this.imageClassifier) {
        this.imageClassifier = await pipeline(
          'image-classification',
          'google/vit-base-patch16-224',
          { device: 'webgpu' }
        );
      }
      
      // Initialize text generation for recommendations
      if (!this.textGenerator) {
        this.textGenerator = await pipeline(
          'text-generation',
          'microsoft/DialoGPT-medium',
          { device: 'webgpu' }
        );
      }
    } catch (error) {
      console.warn('WebGPU not available, falling back to CPU:', error);
      // Fallback to CPU
      this.imageClassifier = await pipeline(
        'image-classification',
        'google/vit-base-patch16-224'
      );
    }
  }

  async analyzeXRayImage(imageElement: HTMLImageElement): Promise<XRayAnalysisResult> {
    await this.initializeModels();
    
    try {
      // Convert image to canvas for analysis
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      canvas.width = imageElement.naturalWidth;
      canvas.height = imageElement.naturalHeight;
      ctx.drawImage(imageElement, 0, 0);
      
      // Get image data
      const imageData = canvas.toDataURL('image/jpeg', 0.8);
      
      // Analyze with the model
      const results = await this.imageClassifier(imageData);
      
      // Process results for dental conditions
      const analysis = this.processDentalAnalysis(results);
      
      return {
        ...analysis,
        toothConditions: this.identifyToothConditions(results),
        overallOralHealth: this.assessOverallOralHealth(analysis),
      };
    } catch (error) {
      console.error('Error analyzing X-ray:', error);
      throw new Error('فشل في تحليل الأشعة السينية');
    }
  }

  async analyzeDSDImage(imageElement: HTMLImageElement): Promise<DSDAnalysisResult> {
    await this.initializeModels();
    
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      canvas.width = imageElement.naturalWidth;
      canvas.height = imageElement.naturalHeight;
      ctx.drawImage(imageElement, 0, 0);
      
      const imageData = canvas.toDataURL('image/jpeg', 0.8);
      const results = await this.imageClassifier(imageData);
      
      // Process results for DSD analysis
      const analysis = this.processDSDAnalysis(results);
      
      return {
        ...analysis,
        facialSymmetry: this.calculateFacialSymmetry(results),
        smileAesthetics: this.analyzeSmileAesthetics(results),
        treatmentSuggestions: this.generateTreatmentSuggestions(analysis),
      };
    } catch (error) {
      console.error('Error analyzing DSD image:', error);
      throw new Error('فشل في تحليل الابتسامة الرقمية');
    }
  }

  private processDentalAnalysis(results: any[]): AIAnalysisResult {
    // Mock analysis based on image classification results
    const conditions = [];
    let confidence = 0.75;
    let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';

    // Simulate dental condition detection
    if (results.some(r => r.label.toLowerCase().includes('dark') || r.score > 0.6)) {
      conditions.push('تسوس محتمل');
      riskLevel = 'medium';
      confidence = 0.82;
    }

    if (results.some(r => r.label.toLowerCase().includes('edge') || r.score > 0.7)) {
      conditions.push('تآكل الأسنان');
      riskLevel = 'high';
    }

    if (results.some(r => r.label.toLowerCase().includes('blur') || r.score > 0.5)) {
      conditions.push('التهاب اللثة محتمل');
    }

    const recommendations = this.generateRecommendations(conditions, riskLevel);

    return {
      confidence,
      detectedConditions: conditions.length > 0 ? conditions : ['لا توجد مشاكل واضحة'],
      recommendations,
      analysisData: {
        modelResults: results,
        processingTime: Date.now(),
      },
      riskLevel,
    };
  }

  private processDSDAnalysis(results: any[]): AIAnalysisResult {
    const conditions = [];
    let confidence = 0.78;
    let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';

    // Simulate DSD analysis
    conditions.push('تحليل الابتسامة مكتمل');
    
    if (results.some(r => r.score < 0.7)) {
      conditions.push('عدم تماثل في الابتسامة');
      riskLevel = 'medium';
    }

    const recommendations = [
      'تحسين توازن الابتسامة',
      'تقويم الأسنان المحتمل',
      'تبييض الأسنان',
      'تحسين شكل اللثة'
    ];

    return {
      confidence,
      detectedConditions: conditions,
      recommendations,
      analysisData: {
        modelResults: results,
        processingTime: Date.now(),
      },
      riskLevel,
    };
  }

  private identifyToothConditions(results: any[]) {
    // Simulate tooth-specific analysis
    return [
      { toothNumber: '11', conditions: ['سليم'], severity: 0.1 },
      { toothNumber: '12', conditions: ['تسوس سطحي'], severity: 0.3 },
      { toothNumber: '21', conditions: ['سليم'], severity: 0.0 },
      { toothNumber: '22', conditions: ['تآكل طفيف'], severity: 0.2 },
    ];
  }

  private assessOverallOralHealth(analysis: AIAnalysisResult): string {
    if (analysis.riskLevel === 'low') return 'صحة الفم جيدة';
    if (analysis.riskLevel === 'medium') return 'تحتاج لمراجعة دورية';
    if (analysis.riskLevel === 'high') return 'تحتاج لعلاج فوري';
    return 'حالة حرجة - علاج عاجل';
  }

  private calculateFacialSymmetry(results: any[]): number {
    // Simulate facial symmetry calculation
    return Math.random() * 0.3 + 0.7; // Between 0.7 and 1.0
  }

  private analyzeSmileAesthetics(results: any[]): string[] {
    return [
      'خط الابتسامة متوازن',
      'لون الأسنان طبيعي', 
      'شكل الأسنان منتظم',
      'نسبة عرض الأسنان مثالية'
    ];
  }

  private generateTreatmentSuggestions(analysis: AIAnalysisResult): string[] {
    const suggestions = [];
    
    if (analysis.riskLevel === 'medium') {
      suggestions.push('تقويم أسنان تجميلي');
      suggestions.push('تبييض أسنان احترافي');
    }
    
    if (analysis.riskLevel === 'high') {
      suggestions.push('علاج تقويمي شامل');
      suggestions.push('زراعة أسنان');
      suggestions.push('قشور أسنان (فينيرز)');
    }
    
    suggestions.push('صيانة دورية');
    return suggestions;
  }

  private generateRecommendations(conditions: string[], riskLevel: string): string[] {
    const recommendations = [];
    
    if (conditions.includes('تسوس محتمل')) {
      recommendations.push('فحص تفصيلي للأسنان');
      recommendations.push('حشوات أسنان إذا لزم الأمر');
      recommendations.push('تحسين نظافة الأسنان');
    }
    
    if (conditions.includes('التهاب اللثة محتمل')) {
      recommendations.push('تنظيف أسنان احترافي');
      recommendations.push('استخدام غسول فم مضاد للبكتيريا');
      recommendations.push('فحص دوري للثة');
    }
    
    if (conditions.includes('تآكل الأسنان')) {
      recommendations.push('واقي أسنان ليلي');
      recommendations.push('تجنب المشروبات الحمضية');
      recommendations.push('علاج حساسية الأسنان');
    }
    
    recommendations.push('مراجعة دورية كل 6 أشهر');
    return recommendations;
  }
}

export const aiAnalysisService = new AIAnalysisService();