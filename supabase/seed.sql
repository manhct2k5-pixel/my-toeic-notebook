-- ====================================================================
-- MY TOEIC NOTEBOOK - SEED DATA FOR SUPABASE POSTGRESQL
-- ====================================================================

-- Insert Sample Topics
INSERT INTO public.topics (id, name, description, color) VALUES
('11111111-1111-1111-1111-111111111111', 'Office & Work', 'Từ vựng môi trường công sở, họp hành, quản lý công việc và đồng nghiệp', '#2563eb'),
('22222222-2222-2222-2222-222222222222', 'Finance & Banking', 'Từ vựng tài chính, thanh toán, ngân sách, hóa đơn và kế toán', '#059669'),
('33333333-3333-3333-3333-333333333333', 'Contracts & Agreements', 'Hợp đồng, điều khoản, cam kết và đàm phán thương mại', '#7c3aed'),
('44444444-4444-4444-4444-444444444444', 'Marketing & Sales', 'Chiến dịch quảng bá, nghiên cứu thị trường và tiếp thị khách hàng', '#ea580c')
ON CONFLICT (id) DO NOTHING;

-- Insert Sample Units
INSERT INTO public.units (id, title, description, category) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Lesson 01 – Contracts', 'Các từ vựng cốt lõi về ký kết hợp đồng, điều khoản và hủy bỏ thỏa thuận', 'General'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Lesson 02 – Marketing', 'Từ vựng về thu hút khách hàng, thuyết phục và tung sản phẩm mới', 'General'),
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'TOEIC Listening – Part 2 – Unit 01', 'Hỏi đáp trong công sở: lịch họp, phân công dự án và báo cáo', 'Listening'),
('dddddddd-dddd-dddd-dddd-dddddddddddd', 'TOEIC Reading – Part 7 – Unit 03', 'Thư điện tử thông báo lịch bảo trì văn phòng và ngân sách quý', 'Reading')
ON CONFLICT (id) DO NOTHING;
