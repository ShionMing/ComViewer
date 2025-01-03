interface IProps {
    data: any;
}

export default function CustomCodeRenderer(props: IProps) {
    const {data} = props;
    return (
        <pre className="bg-gray-800 rounded-md p-4">
            <code className="text-gray-100 text-sm">{data}</code>
        </pre>
    );
}
