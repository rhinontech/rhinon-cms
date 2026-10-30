import { Op } from "sequelize";
import { sequelize } from "../config/database";
import {
  ClientRequest, FieldDefinition, Project, ProjectMember, ProjectRepo, ProjectSecret, RepoCommit,
  Subtask, Task, TaskActivity, TaskAttachment, TaskComment, TaskDependency, TaskTag,
  TeamChatConversation, TimeEntry, WorkflowStatus,
} from "../models";
import { deleteObject } from "./storage";
import { removeDeployKey } from "./github/keys";

export interface ProjectDeletionSummary {
  tasks: number;
  files: number;
  repos: number;
  secrets: number;
}

/**
 * Hard-deletes a project and everything that only exists because of it:
 * tasks (and their subitems, comments, tags, dependencies, files, activity,
 * time), client requests, custom statuses and fields, collaborators, GitHub
 * links with their commits and deploy keys, and stored secrets.
 *
 * Every table is cleared explicitly. The association-level CASCADEs only hold
 * where sync created a real foreign key, which older tables can't be relied on
 * for. All rows go in one transaction; S3 objects and GitHub deploy keys can't
 * join it, so they're removed after commit, best-effort.
 *
 * A project's team-chat channel survives, unlinked — conversation history is
 * not the project's to destroy.
 */
export async function deleteProject(projectId: string): Promise<ProjectDeletionSummary> {
  const tasks = await Task.findAll({ where: { projectId }, attributes: ["id"] });
  const taskIds = tasks.map((t) => t.id);
  const byTask = { taskId: { [Op.in]: taskIds } };

  const attachments = taskIds.length
    ? await TaskAttachment.findAll({ where: byTask, attributes: ["key"] })
    : [];
  const repos = await ProjectRepo.findAll({ where: { projectId } });
  const secrets = await ProjectSecret.count({ where: { projectId } });

  await sequelize.transaction(async (transaction) => {
    const t = { transaction };
    if (taskIds.length) {
      for (const model of [Subtask, TaskComment, TaskTag, TaskAttachment, TaskActivity, TimeEntry]) {
        await (model as any).destroy({ where: byTask, ...t });
      }
      await TaskDependency.destroy({
        where: { [Op.or]: [{ predecessorId: { [Op.in]: taskIds } }, { successorId: { [Op.in]: taskIds } }] },
        ...t,
      });
      // Work outside this project that points in: let go rather than dangle.
      await Task.update({ blockedById: null }, { where: { blockedById: { [Op.in]: taskIds } }, ...t });
      await Task.update({ parentTaskId: null }, { where: { parentTaskId: { [Op.in]: taskIds } }, ...t });
      await ClientRequest.update({ convertedTaskId: null } as any, { where: { convertedTaskId: { [Op.in]: taskIds } }, ...t });
    }
    await Task.destroy({ where: { projectId }, ...t });
    await ClientRequest.destroy({ where: { projectId }, ...t });
    await WorkflowStatus.destroy({ where: { projectId }, ...t });
    await FieldDefinition.destroy({ where: { projectId }, ...t });
    await ProjectMember.destroy({ where: { projectId }, ...t });
    await RepoCommit.destroy({ where: { projectId }, ...t });
    await ProjectRepo.destroy({ where: { projectId }, ...t });
    await ProjectSecret.destroy({ where: { projectId }, ...t });
    await TeamChatConversation.update({ projectId: null }, { where: { projectId }, ...t });
    await Project.destroy({ where: { id: projectId }, ...t });
  });

  await Promise.all([
    ...attachments.map((a) =>
      deleteObject(a.key).catch((err) => console.error("[Project delete] S3 object:", a.key, err.message))
    ),
    ...repos.map(removeDeployKey),
  ]);

  return { tasks: taskIds.length, files: attachments.length, repos: repos.length, secrets };
}
