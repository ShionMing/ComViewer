interface IProps {
    data: any;
}

export default function CustomImageRenderer(props: IProps) {
    const {data} = props;
    return (
        <div className="relative w-full min-h-[15rem]">
            <img className="object-contain" src={data.file.url} alt="image"/>
        </div>
    );
}
