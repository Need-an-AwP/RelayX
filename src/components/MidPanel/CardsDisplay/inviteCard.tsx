import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"


const InviteCard = ({totalCardsCount}:{totalCardsCount:number}) => {
    return (
        <Card className={`aspect-video bg-muted 
            ${totalCardsCount === 2 && '@md:col-span-2 @md:w-[50%] mx-auto'}`}>
            <div className="flex flex-col text-sm text-muted-foreground justify-center items-center h-full w-full">
                <p>there is only you here😢</p>
                <p>invite someone else</p>
            </div>
        </Card>
    )
}

export default InviteCard