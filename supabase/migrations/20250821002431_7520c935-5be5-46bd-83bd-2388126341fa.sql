-- Add AI analysis results to medical_images table
ALTER TABLE medical_images 
ADD COLUMN ai_analysis_result JSONB,
ADD COLUMN ai_confidence_score NUMERIC(5,2),
ADD COLUMN ai_detected_conditions TEXT[],
ADD COLUMN ai_analysis_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN ai_analysis_status TEXT DEFAULT 'pending';

-- Create AI analysis results table
CREATE TABLE ai_analysis_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    image_id UUID NOT NULL REFERENCES medical_images(id) ON DELETE CASCADE,
    clinic_id UUID NOT NULL,
    analysis_type TEXT NOT NULL, -- 'xray_analysis', 'dsd_analysis', 'cbct_analysis'
    ai_model TEXT NOT NULL,
    confidence_score NUMERIC(5,2),
    detected_conditions JSONB,
    recommendations JSONB,
    analysis_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on ai_analysis_results
ALTER TABLE ai_analysis_results ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for ai_analysis_results
CREATE POLICY "Users can create AI analyses for their clinic" 
ON ai_analysis_results 
FOR INSERT 
WITH CHECK (clinic_id = (SELECT id FROM get_current_user_profile()));

CREATE POLICY "Users can view their clinic AI analyses" 
ON ai_analysis_results 
FOR SELECT 
USING (clinic_id = (SELECT id FROM get_current_user_profile()));

CREATE POLICY "Users can update their clinic AI analyses" 
ON ai_analysis_results 
FOR UPDATE 
USING (clinic_id = (SELECT id FROM get_current_user_profile()));

CREATE POLICY "Users can delete their clinic AI analyses" 
ON ai_analysis_results 
FOR DELETE 
USING (clinic_id = (SELECT id FROM get_current_user_profile()));

-- Create updated_at trigger for ai_analysis_results
CREATE TRIGGER update_ai_analysis_results_updated_at
    BEFORE UPDATE ON ai_analysis_results
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_ai_analysis_results_image_id ON ai_analysis_results(image_id);
CREATE INDEX idx_ai_analysis_results_clinic_id ON ai_analysis_results(clinic_id);
CREATE INDEX idx_ai_analysis_results_analysis_type ON ai_analysis_results(analysis_type);
CREATE INDEX idx_medical_images_ai_status ON medical_images(ai_analysis_status);
CREATE INDEX idx_medical_images_ai_conditions ON medical_images USING GIN(ai_detected_conditions);