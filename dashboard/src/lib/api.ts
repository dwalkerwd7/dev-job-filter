export default function API(subroute: string) {
    const BASE_PATH = process.env.BASE_PATH;
    if (subroute.startsWith('/')) subroute = subroute.slice(1)
    return `${BASE_PATH}/api/${subroute}`
}
