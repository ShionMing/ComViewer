export interface IComment {
    commentId: string;
    author: string;
    avatar?: string;
    parentId: string;
    text: string;
    createTime: string;
    commentsublist: IComment[];
}

export interface IPost {
    postId: string;
    author: string;
    commentlist: IComment[];
    text: string;
    title: string;
    createTime: string;
}

export interface IExtendedPost extends IPost {
}
