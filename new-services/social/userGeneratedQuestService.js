// new-services/social/userGeneratedQuestService.js
// Service สำหรับจัดการ Job Postings (งาน/รับจ้าง)
// Collection: 'jobpostings' - แยกจาก 'socialquests' (เควสจากชุมชน)
const UserGeneratedQuest = require('../../models/UserGeneratedQuest');
const UserQuestParticipation = require('../../models/UserQuestParticipation');
const JobApplication = require('../../models/JobApplication');
const JobLog = require('../../models/JobLog');
const QuestSettings = require('../../models/QuestSettings');
const User = require('../../models/User');

class UserGeneratedQuestService {

    // สร้าง quest ใหม่ (Job Posting)
    async createQuest(userId, questData) {
        try {
            console.log('Creating quest for user:', userId, 'data:', questData);

            const user = await User.findById(userId);
            if (!user) throw new Error('User not found');

            // ตรวจสอบ cash balance สำหรับ job posting
            // ถ้าเป็น job posting (มี details.budget) ต้องเช็ค cash
            if (questData.details?.budget) {
                const budget = questData.details.budget;
                if (user.cash < budget) {
                    throw new Error(`เงินในระบบไม่เพียงพอ ต้องการ ${budget} บาท แต่มี ${user.cash} บาท`);
                }
            }

            // คำนวณ expiredAt
            const expiredAt = new Date();
            expiredAt.setDate(expiredAt.getDate() + (questData.settings?.durationDays || 30));

            // สร้าง quest
            const quest = new UserGeneratedQuest({
                ...questData,
                creator: userId,
                status: questData.status || 'active',
                expiredAt: expiredAt
            });

            await quest.save();

            // Update employer stats
            user.jobStats.employer.totalJobsPosted += 1;
            user.jobStats.employer.activeJobs += 1;
            await user.save();

            // Log action (no req available in service, will be added in route if needed)
            await this.logJobAction('job_created', quest._id, userId, null, null, {
                title: quest.title,
                budget: questData.details?.budget || 0
            }, null);

            return quest;
        } catch (error) {
            console.error('Error creating quest:', error);
            throw error;
        }
    }

    // ดึง quests สำหรับแสดงใน Landing Page
    async getPublicQuests(userId, filters = {}) {
        try {
            const { page = 1, limit = 10 } = filters;

            const query = {
                status: 'active',
                'settings.isPublic': true,
                expiredAt: { $gt: new Date() }
            };

            const quests = await UserGeneratedQuest.find(query)
                .populate('creator', 'name photo')
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit);

            return {
                quests,
                pagination: {
                    page,
                    limit,
                    total: await UserGeneratedQuest.countDocuments(query)
                }
            };
        } catch (error) {
            console.error('Error getting public quests:', error);
            throw error;
        }
    }

    // ผู้ใช้เข้าร่วม quest
    async joinQuest(userId, questId) {
        try {
            const quest = await UserGeneratedQuest.findById(questId);
            if (!quest) throw new Error('Quest not found');

            if (quest.status !== 'active') {
                throw new Error('Quest is not active');
            }

            if (new Date(quest.expiredAt) < new Date()) {
                throw new Error('Quest has expired');
            }

            // ตรวจสอบว่าเข้าร่วมแล้วหรือยัง
            const existingParticipation = await UserQuestParticipation.findOne({
                user: userId,
                quest: questId
            });

            if (existingParticipation) {
                throw new Error('Already joined this quest');
            }

            // สร้าง participation record
            const participation = new UserQuestParticipation({
                user: userId,
                quest: questId,
                progress: {
                    current: 0,
                    target: quest.target
                },
                status: 'joined'
            });

            await participation.save();

            // อัพเดท quest stats
            quest.stats.totalParticipants += 1;
            await quest.save();

            return participation;
        } catch (error) {
            console.error('Error joining quest:', error);
            throw error;
        }
    }

    // ส่งการยืนยัน quest
    async submitVerification(userId, questId, verificationData) {
        try {
            const participation = await UserQuestParticipation.findOne({
                user: userId,
                quest: questId
            });

            if (!participation) {
                throw new Error('Participation not found');
            }

            participation.verification = {
                ...verificationData,
                submittedAt: new Date()
            };
            participation.status = 'pending_verification';

            await participation.save();

            return { status: 'pending_verification', message: 'Verification submitted successfully' };
        } catch (error) {
            console.error('Error submitting verification:', error);
            throw error;
        }
    }

    // ดึง quests ที่ผู้ใช้สร้าง
    async getUserCreatedQuests(userId) {
        try {
            const quests = await UserGeneratedQuest.find({ creator: userId })
                .sort({ createdAt: -1 });

            return quests;
        } catch (error) {
            console.error('Error getting user created quests:', error);
            throw error;
        }
    }

    // ดึง quests ที่ผู้ใช้เข้าร่วม
    async getUserParticipations(userId) {
        try {
            const participations = await UserQuestParticipation.find({ user: userId })
                .populate('quest')
                .sort({ joinedAt: -1 });

            return participations;
        } catch (error) {
            console.error('Error getting user participations:', error);
            throw error;
        }
    }

    // ตรวจสอบและอัพเดท quests ที่หมดอายุ
    async checkAndUpdateExpiredQuests() {
        try {
            const expiredQuests = await UserGeneratedQuest.updateMany(
                {
                    status: 'active',
                    expiredAt: { $lt: new Date() }
                },
                {
                    $set: { status: 'expired' }
                }
            );

            console.log(`Updated ${expiredQuests.modifiedCount} expired quests`);
            return expiredQuests;
        } catch (error) {
            console.error('Error updating expired quests:', error);
            throw error;
        }
    }

    // สมัครงาน
    async applyJob(workerId, jobId, message = '') {
        try {
            const job = await UserGeneratedQuest.findById(jobId);
            if (!job) throw new Error('ไม่พบงานนี้');

            if (job.status !== 'active') {
                throw new Error('งานนี้ไม่เปิดรับสมัคร');
            }

            if (job.creator.toString() === workerId.toString()) {
                throw new Error('คุณไม่สามารถสมัครงานของตัวเองได้');
            }

            // ตรวจสอบว่าสมัครแล้วหรือยัง
            const existing = await JobApplication.findOne({
                job: jobId,
                worker: workerId
            });
            if (existing) {
                throw new Error('คุณได้สมัครงานนี้แล้ว');
            }

            const application = new JobApplication({
                job: jobId,
                worker: workerId,
                employer: job.creator,
                message: message,
                status: 'pending'
            });

            await application.save();

            // Update worker stats
            const worker = await User.findById(workerId);
            if (worker) {
                worker.jobStats.worker.totalJobsApplied += 1;
                await worker.save();
            }

            // Log action
            await this.logJobAction('job_applied', jobId, workerId, job.creator, application._id, {
                message: message
            });

            return application;
        } catch (error) {
            console.error('Error applying job:', error);
            throw error;
        }
    }

    // ยอมรับคนทำงาน
    async acceptWorker(employerId, applicationId) {
        try {
            const application = await JobApplication.findById(applicationId)
                .populate('job')
                .populate('worker');

            if (!application) throw new Error('ไม่พบการสมัครงานนี้');

            if (application.employer.toString() !== employerId.toString()) {
                throw new Error('คุณไม่มีสิทธิ์ยอมรับการสมัครงานนี้');
            }

            if (application.status !== 'pending') {
                throw new Error('การสมัครงานนี้ได้รับการจัดการแล้ว');
            }

            application.status = 'accepted';
            application.acceptedAt = new Date();
            await application.save();

            // Update stats
            const employer = await User.findById(employerId);
            const worker = await User.findById(application.worker._id);

            if (employer) {
                // ไม่ต้องอัพเดท activeJobs เพราะยังไม่จบงาน
            }

            if (worker) {
                worker.jobStats.worker.totalJobsAccepted += 1;
                worker.jobStats.worker.activeJobs += 1;
                await worker.save();
            }

            // Log action
            await this.logJobAction('job_accepted', application.job._id, employerId, application.worker._id, applicationId);

            return application;
        } catch (error) {
            console.error('Error accepting worker:', error);
            throw error;
        }
    }

    // ปฏิเสธการสมัครงาน
    async rejectWorker(employerId, applicationId) {
        try {
            const application = await JobApplication.findById(applicationId);

            if (!application) throw new Error('ไม่พบการสมัครงานนี้');

            if (application.employer.toString() !== employerId.toString()) {
                throw new Error('คุณไม่มีสิทธิ์ปฏิเสธการสมัครงานนี้');
            }

            if (application.status !== 'pending') {
                throw new Error('การสมัครงานนี้ได้รับการจัดการแล้ว');
            }

            application.status = 'rejected';
            await application.save();

            // Log action
            await this.logJobAction('job_rejected', application.job, employerId, application.worker, applicationId);

            return application;
        } catch (error) {
            console.error('Error rejecting worker:', error);
            throw error;
        }
    }

    // จบงานและจ่ายเงิน
    async completeJob(employerId, applicationId) {
        try {
            const application = await JobApplication.findById(applicationId)
                .populate('job')
                .populate('worker')
                .populate('employer');

            if (!application) throw new Error('ไม่พบการสมัครงานนี้');

            if (application.employer._id.toString() !== employerId.toString()) {
                throw new Error('คุณไม่มีสิทธิ์จบงานนี้');
            }

            if (application.status !== 'accepted') {
                throw new Error('งานนี้ยังไม่ได้รับการยอมรับ');
            }

            const job = application.job;
            const budget = job.details?.budget || 0;

            if (budget <= 0) {
                throw new Error('ไม่พบงบประมาณของงานนี้');
            }

            // ดึงค่า commission fee
            const commissionFee = await QuestSettings.getSetting('job_commission_fee') || 50;
            const workerReceived = budget - commissionFee;

            // ตรวจสอบ cash balance ของคนจ้างงาน
            const employer = await User.findById(employerId);
            if (employer.cash < budget) {
                throw new Error(`เงินในระบบไม่เพียงพอ ต้องการ ${budget} บาท แต่มี ${employer.cash} บาท`);
            }

            // หักเงินจากคนจ้างงาน
            employer.cash -= budget;
            employer.jobStats.employer.totalCashSpent += budget;
            employer.jobStats.employer.totalFeesPaid += commissionFee;
            employer.jobStats.employer.totalJobsCompleted += 1;
            employer.jobStats.employer.activeJobs = Math.max(0, employer.jobStats.employer.activeJobs - 1);
            await employer.save();

            // เพิ่มเงินให้คนทำงาน
            const worker = await User.findById(application.worker._id);
            if (worker) {
                worker.cash += workerReceived;
                worker.jobStats.worker.totalCashEarned += workerReceived;
                worker.jobStats.worker.totalJobsCompleted += 1;
                worker.jobStats.worker.activeJobs = Math.max(0, worker.jobStats.worker.activeJobs - 1);
                await worker.save();
            }

            // อัพเดท application
            application.status = 'completed';
            application.completedAt = new Date();
            application.payment = {
                jobAmount: budget,
                commissionFee: commissionFee,
                workerReceived: workerReceived,
                paidAt: new Date()
            };
            await application.save();

            // Log action
            await this.logJobAction('job_completed', job._id, employerId, application.worker._id, applicationId, {
                budget: budget,
                commissionFee: commissionFee,
                workerReceived: workerReceived
            });

            // Log payment
            await this.logJobAction('payment_processed', job._id, employerId, application.worker._id, applicationId, {
                amount: budget,
                commissionFee: commissionFee,
                workerReceived: workerReceived
            });

            return application;
        } catch (error) {
            console.error('Error completing job:', error);
            throw error;
        }
    }

    // ดึงรายการผู้สมัครงาน
    async getJobApplications(jobId, employerId) {
        try {
            const job = await UserGeneratedQuest.findById(jobId);
            if (!job) throw new Error('ไม่พบงานนี้');

            if (job.creator.toString() !== employerId.toString()) {
                throw new Error('คุณไม่มีสิทธิ์ดูรายการผู้สมัครงานนี้');
            }

            const applications = await JobApplication.find({ job: jobId })
                .populate('worker', 'name photo email')
                .sort({ appliedAt: -1 });

            return applications;
        } catch (error) {
            console.error('Error getting job applications:', error);
            throw error;
        }
    }

    // ยกเลิกงาน (สำหรับคนจ้างงาน)
    async cancelJob(employerId, jobId) {
        try {
            const job = await UserGeneratedQuest.findById(jobId);
            if (!job) throw new Error('ไม่พบงานนี้');

            if (job.creator.toString() !== employerId.toString()) {
                throw new Error('คุณไม่มีสิทธิ์ยกเลิกงานนี้');
            }

            if (job.status === 'completed' || job.status === 'cancelled') {
                throw new Error('ไม่สามารถยกเลิกงานที่จบแล้วหรือยกเลิกแล้วได้');
            }

            // ตรวจสอบว่ามีงานที่ accepted หรือ completed หรือไม่
            const activeApplications = await JobApplication.find({
                job: jobId,
                status: { $in: ['accepted', 'completed'] }
            });

            if (activeApplications.length > 0) {
                throw new Error('ไม่สามารถยกเลิกงานที่มีคนทำงานที่ยอมรับแล้วได้ กรุณาจบงานก่อน');
            }

            // อัพเดทสถานะงาน
            job.status = 'cancelled';
            await job.save();

            // อัพเดท applications ทั้งหมดเป็น cancelled
            await JobApplication.updateMany(
                { job: jobId, status: 'pending' },
                { $set: { status: 'cancelled' } }
            );

            // อัพเดท employer stats
            const employer = await User.findById(employerId);
            if (employer) {
                employer.jobStats.employer.activeJobs = Math.max(0, employer.jobStats.employer.activeJobs - 1);
                await employer.save();
            }

            // อัพเดท worker stats (สำหรับผู้ที่สมัครแล้ว)
            const pendingApplications = await JobApplication.find({
                job: jobId,
                status: 'cancelled'
            }).populate('worker');

            for (const app of pendingApplications) {
                if (app.worker) {
                    const worker = await User.findById(app.worker._id);
                    if (worker) {
                        // ไม่ต้องลด totalJobsApplied เพราะยังนับได้
                        await worker.save();
                    }
                }
            }

            // Log action
            await this.logJobAction('job_cancelled', jobId, employerId, null, null, {
                title: job.title
            }, null);

            return job;
        } catch (error) {
            console.error('Error cancelling job:', error);
            throw error;
        }
    }

    // Helper: Log job action
    async logJobAction(action, jobId, userId, relatedUserId = null, applicationId = null, details = {}, req = null) {
        try {
            const log = new JobLog({
                action: action,
                job: jobId,
                user: userId,
                relatedUser: relatedUserId,
                application: applicationId,
                details: details,
                ipAddress: req?.ip || req?.connection?.remoteAddress || '',
                userAgent: req?.get('user-agent') || ''
            });
            await log.save();
        } catch (error) {
            console.error('Error logging job action:', error);
            // Don't throw - logging should not break the main flow
        }
    }
}

// ส่งออก instance ของ service
module.exports = new UserGeneratedQuestService();