-- Add sample feedback messages for admin testing
INSERT INTO feedback (feedback_id, user_id, role, message, approved, created_at) VALUES
('FB008', 'US001', 'donor', 'I would like to know more about the donation process and eligibility criteria.', 0, NOW()),
('FB009', 'US003', 'hospital', 'Can we get more detailed reports on blood inventory levels?', 0, NOW()),
('FB010', 'US002', 'mro', 'The medical verification process is working well. Keep up the good work!', 0, NOW()),
('FB011', 'US007', 'hospital', 'We need urgent blood supply for emergency cases. Please prioritize.', 0, NOW()),
('FB012', 'US008', 'donor', 'The donation experience was excellent. Staff were very professional.', 1, NOW()),
('FB013', 'US010', 'mro', 'Can we have more training sessions for new MRO officers?', 0, NOW()); 